/**
 * End-to-end test of the buying path against a real MongoDB.
 *
 * Covers the things that would cost real money if they broke: admin routes
 * refusing anonymous writes, prices being recomputed server-side, stock being
 * decremented exactly once, and a forged payment signature being rejected.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = "test-secret-".padEnd(48, "x");
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.NODE_ENV = "test";

let mongod;
let server;
let base;
// Set MONGODB_TEST_URI to use a MongoDB you already run; otherwise an
// in-memory server is started (it downloads a mongod binary the first time).
// Where neither is reachable the whole suite skips rather than failing red.
let skipReason = null;

// Placing an order requires an Idempotency-Key. A fresh one per call is what a
// browser does for each new checkout attempt; passing the same one twice is how
// a retry is recognised.
const idem = () => ({ "Idempotency-Key": crypto.randomUUID() });

const request = async (method, path, { body, cookie, headers } = {}) => {
    const response = await fetch(base + path, {
        method,
        headers: {
            "content-type": "application/json",
            ...(cookie ? { cookie } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON body */ }
    return { status: response.status, body: json, raw: text, headers: response.headers };
};

before(async () => {
    try {
        if (process.env.MONGODB_TEST_URI) {
            await mongoose.connect(process.env.MONGODB_TEST_URI);
        } else {
            mongod = await MongoMemoryServer.create();
            await mongoose.connect(mongod.getUri());
        }
    } catch (error) {
        skipReason = `no MongoDB available (${error.message.split("\n")[0]})`;
        return;
    }

    const [
        { default: authRouter },
        { default: productRouter },
        { default: categoryRouter },
        { default: roomRouter },
        { default: orderRouter },
        { default: addressRouter },
        { default: couponRouter },
    ] = await Promise.all([
        import("../src/routers/auth.router.js"),
        import("../src/routers/product.router.js"),
        import("../src/routers/category.router.js"),
        import("../src/routers/room.router.js"),
        import("../src/routers/order.router.js"),
        import("../src/routers/address.router.js"),
        import("../src/routers/coupon.router.js"),
    ]);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRouter);
    app.use("/api/product", productRouter);
    app.use("/api/category", categoryRouter);
    app.use("/api/room", roomRouter);
    app.use("/api/order", orderRouter);
    app.use("/api/address", addressRouter);
    app.use("/api/coupon", couponRouter);

    // The real server does this before it listens (see config/connectDb.js).
    // Without it the unique indexes do not exist yet and the tests that prove
    // they hold would pass or fail on timing rather than on behaviour.
    const { ensureIndexes } = await import("../src/config/connectDb.js");
    await ensureIndexes();

    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server?.close();
    if (mongoose.connection.readyState) await mongoose.connection.close();
    await mongod?.stop();
});

// Every case funnels through this so a missing database skips the suite with
// one clear reason instead of twelve identical stack traces.
const dbTest = (name, fn) => test(name, async (t) => {
    if (skipReason) return t.skip(skipReason);
    await fn(t);
});

/* ------------------------------------------------------------------ */

const state = {};

dbTest("the admin write routes reject an anonymous caller", async () => {
    const created = await request("POST", "/api/product/create", { body: { name: "Sneaky" } });
    assert.equal(created.status, 401);

    const deleted = await request("DELETE", "/api/category/delete/507f1f77bcf86cd799439011");
    assert.equal(deleted.status, 401);
});

dbTest("an admin can sign in and seed the catalogue", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const UserModel = (await import("../src/models/user.model.js")).default;
    const CategoryModel = (await import("../src/models/category.model.js")).default;
    const RoomModel = (await import("../src/models/room.model.js")).default;
    const ProductModel = (await import("../src/models/product.model.js")).default;

    await UserModel.create({
        firstName: "Admin",
        email: "admin@nestro.in",
        password: await bcrypt.hash("supersecret1", 10),
        role: "admin",
        isVerified: true,
    });

    const signin = await request("POST", "/api/auth/admin/signin", {
        body: { email: "admin@nestro.in", password: "supersecret1" },
    });
    assert.equal(signin.status, 200);
    state.adminCookie = signin.headers.getSetCookie().join("; ");
    assert.match(state.adminCookie, /token=/);

    const category = await CategoryModel.create({ name: "Sofas", slug: "sofas" });
    const room = await RoomModel.create({ name: "Living Room", slug: "living-room" });

    // Two units in stock, priced at 45,000.
    const product = await ProductModel.create({
        categoryId: category._id,
        roomId: room._id,
        name: "Aurora Three Seater",
        slug: "aurora-three-seater",
        originalPrice: 60000,
        salePrice: 45000,
        discount: 25,
        stockQty: 2,
    });

    state.productId = String(product._id);
    assert.equal(product.stock, true, "the derived stock flag follows the count");
});

dbTest("a shopper signs up, verifies and signs in", async () => {
    const UserModel = (await import("../src/models/user.model.js")).default;

    const signup = await request("POST", "/api/auth/signup", {
        body: { firstName: "Rakesh", email: "buyer@example.com", password: "hunter2hunter2" },
    });
    assert.equal(signup.status, 201);

    // Read the code straight from the database — email is not configured here.
    const pending = await UserModel.findOne({ email: "buyer@example.com" });
    const verify = await request("POST", "/api/auth/verify-otp", {
        body: { email: "buyer@example.com", otp: pending.otp.code },
    });
    assert.equal(verify.status, 200);
    state.buyerCookie = verify.headers.getSetCookie().join("; ");
});

dbTest("a short password is refused before it reaches the database", async () => {
    const weak = await request("POST", "/api/auth/signup", {
        body: { firstName: "X", email: "weak@example.com", password: "short" },
    });
    assert.equal(weak.status, 400);
    assert.match(weak.body.message, /8 characters/);
});

dbTest("a coupon discount is computed on the server", async () => {
    const CouponModel = (await import("../src/models/coupon.model.js")).default;
    await CouponModel.create({ code: "NESTRO15", type: "percent", value: 15 });

    const applied = await request("POST", "/api/coupon/apply", {
        cookie: state.buyerCookie,
        body: { code: "nestro15", subtotal: 90000 },
    });
    assert.equal(applied.status, 200);
    assert.equal(applied.body.coupon.discount, 13500);
});

dbTest("a COD order prices itself and takes the stock exactly once", async () => {
    const ProductModel = (await import("../src/models/product.model.js")).default;

    const placed = await request("POST", "/api/order/create", {
        cookie: state.buyerCookie,
        headers: idem(),
        body: {
            items: [{ productId: state.productId, quantity: 2 }],
            address: {
                fullName: "Rakesh Meena", phone: "9876543210",
                line1: "12 MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001",
            },
            shippingMethod: "express",
            paymentMethod: "cod",
            couponCode: "NESTRO15",
        },
    });

    assert.equal(placed.status, 201);
    // 2 x 45,000 = 90,000, less 15% (13,500), plus 1,499 express = 77,999.
    assert.equal(placed.body.order.total, 77999);
    assert.equal(placed.body.order.status, "confirmed");
    state.codOrderId = placed.body.order._id;

    const after = await ProductModel.findById(state.productId);
    assert.equal(after.stockQty, 0, "both units were taken");
    assert.equal(after.stock, false, "the derived flag flipped to out of stock");
});

dbTest("a second order cannot oversell what is left", async () => {
    const oversold = await request("POST", "/api/order/create", {
        cookie: state.buyerCookie,
        headers: idem(),
        body: {
            items: [{ productId: state.productId, quantity: 1 }],
            address: {
                fullName: "Rakesh Meena", phone: "9876543210",
                line1: "12 MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001",
            },
            paymentMethod: "cod",
        },
    });
    assert.equal(oversold.status, 400);
    assert.match(oversold.body.message, /out of stock/i);
});

dbTest("an order cannot be placed without an idempotency key", async () => {
    const naked = await request("POST", "/api/order/create", {
        cookie: state.buyerCookie,
        body: {
            items: [{ productId: state.productId, quantity: 1 }],
            address: {
                fullName: "Rakesh Meena", phone: "9876543210",
                line1: "12 MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001",
            },
            paymentMethod: "cod",
        },
    });
    assert.equal(naked.status, 400);
    assert.match(naked.body.message, /idempotency/i);
});

dbTest("the same idempotency key never becomes two orders", async () => {
    const ProductModel = (await import("../src/models/product.model.js")).default;
    const OrderModel = (await import("../src/models/order.model.js")).default;

    // A unit back on the shelf to buy, so this test does not depend on the
    // stock left over from the ones before it.
    await ProductModel.updateOne({ _id: state.productId }, { $set: { stockQty: 5 } });
    const before = await OrderModel.countDocuments();

    const key = { "Idempotency-Key": crypto.randomUUID() };
    const payload = {
        cookie: state.buyerCookie,
        headers: key,
        body: {
            items: [{ productId: state.productId, quantity: 1 }],
            address: {
                fullName: "Rakesh Meena", phone: "9876543210",
                line1: "12 MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001",
            },
            paymentMethod: "cod",
        },
    };

    // Five at once, the way a double-clicked button and its retries arrive.
    const responses = await Promise.all(
        Array.from({ length: 5 }, () => request("POST", "/api/order/create", payload))
    );

    const ids = new Set(responses.map((r) => r.body?.order?._id));
    assert.equal(ids.size, 1, "every response names the same order");
    assert.equal(await OrderModel.countDocuments(), before + 1, "exactly one order was written");

    const after = await ProductModel.findById(state.productId);
    assert.equal(after.stockQty, 4, "the stock was taken once, not five times");

    // Hand the shelf back exactly as it was found: the next test asserts on the
    // stock the earlier COD order took, not on anything this one borrowed.
    await OrderModel.deleteMany({ _id: { $in: [...ids] } });
    await ProductModel.updateOne({ _id: state.productId }, { $set: { stockQty: 0 } });
});

dbTest("cancelling an order puts the stock back", async () => {
    const ProductModel = (await import("../src/models/product.model.js")).default;

    const cancelled = await request("PATCH", `/api/order/${state.codOrderId}/cancel`, {
        cookie: state.buyerCookie,
        body: { reason: "Changed my mind" },
    });
    assert.equal(cancelled.status, 200);

    const after = await ProductModel.findById(state.productId);
    assert.equal(after.stockQty, 2, "the units are sellable again");
    assert.equal(after.stock, true);
});

dbTest("one shopper cannot read another shopper's order", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const UserModel = (await import("../src/models/user.model.js")).default;

    await UserModel.create({
        firstName: "Nosy",
        email: "nosy@example.com",
        password: await bcrypt.hash("hunter2hunter2", 10),
        isVerified: true,
    });
    const signin = await request("POST", "/api/auth/signin", {
        body: { email: "nosy@example.com", password: "hunter2hunter2" },
    });
    const nosyCookie = signin.headers.getSetCookie().join("; ");

    const peek = await request("GET", `/api/order/${state.codOrderId}`, { cookie: nosyCookie });
    assert.equal(peek.status, 404, "another account's order is simply not found");
});

dbTest("a forged payment signature is rejected and the order stays unpaid", async () => {
    const OrderModel = (await import("../src/models/order.model.js")).default;

    const created = await request("POST", "/api/order/create", {
        cookie: state.buyerCookie,
        headers: idem(),
        body: {
            items: [{ productId: state.productId, quantity: 1 }],
            address: {
                fullName: "Rakesh Meena", phone: "9876543210",
                line1: "12 MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001",
            },
            paymentMethod: "razorpay",
        },
    });
    // Razorpay's SDK cannot reach the network here, so the route fails before
    // creating a gateway order — seed one directly to exercise verification.
    let orderId = created.body?.order?._id;
    if (!orderId) {
        const seeded = await OrderModel.findOne({ userId: { $ne: null } }).sort({ createdAt: -1 });
        orderId = String(seeded._id);
    }

    const order = await OrderModel.findById(orderId);
    order.paymentMethod = "razorpay";
    order.paymentStatus = "pending";
    order.status = "pending";
    order.stockCommitted = false;
    order.payment.razorpayOrderId = "order_TESTGATEWAY";
    await order.save();

    const forged = await request("POST", "/api/order/verify-payment", {
        cookie: state.buyerCookie,
        body: {
            orderId,
            razorpayOrderId: "order_TESTGATEWAY",
            razorpayPaymentId: "pay_ATTACKER",
            razorpaySignature: "deadbeef".repeat(8),
        },
    });
    assert.equal(forged.status, 400);

    const stillUnpaid = await OrderModel.findById(orderId);
    assert.equal(stillUnpaid.paymentStatus, "failed");
    assert.notEqual(stillUnpaid.status, "confirmed");
});

dbTest("a correctly signed payment confirms the order and takes the stock", async () => {
    const OrderModel = (await import("../src/models/order.model.js")).default;
    const ProductModel = (await import("../src/models/product.model.js")).default;

    const order = await OrderModel.findOne({ "payment.razorpayOrderId": "order_TESTGATEWAY" });
    order.paymentStatus = "pending";
    await order.save();

    const before = await ProductModel.findById(state.productId);

    const signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update("order_TESTGATEWAY|pay_REAL")
        .digest("hex");

    const verified = await request("POST", "/api/order/verify-payment", {
        cookie: state.buyerCookie,
        body: {
            orderId: String(order._id),
            razorpayOrderId: "order_TESTGATEWAY",
            razorpayPaymentId: "pay_REAL",
            razorpaySignature: signature,
        },
    });
    assert.equal(verified.status, 200);

    const paid = await OrderModel.findById(order._id);
    assert.equal(paid.paymentStatus, "paid");
    assert.equal(paid.status, "confirmed");

    const after = await ProductModel.findById(state.productId);
    assert.equal(
        after.stockQty,
        before.stockQty - order.items.reduce((sum, line) => sum + line.quantity, 0),
        "stock moved by exactly the ordered quantity"
    );
});

dbTest("replaying the same verification does not take the stock twice", async () => {
    const OrderModel = (await import("../src/models/order.model.js")).default;
    const ProductModel = (await import("../src/models/product.model.js")).default;

    const order = await OrderModel.findOne({ "payment.razorpayOrderId": "order_TESTGATEWAY" });
    const before = await ProductModel.findById(state.productId);

    const signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update("order_TESTGATEWAY|pay_REAL")
        .digest("hex");

    const replay = await request("POST", "/api/order/verify-payment", {
        cookie: state.buyerCookie,
        body: {
            orderId: String(order._id),
            razorpayOrderId: "order_TESTGATEWAY",
            razorpayPaymentId: "pay_REAL",
            razorpaySignature: signature,
        },
    });
    assert.equal(replay.status, 200);

    const after = await ProductModel.findById(state.productId);
    assert.equal(after.stockQty, before.stockQty, "stock is unchanged on a replay");
});
