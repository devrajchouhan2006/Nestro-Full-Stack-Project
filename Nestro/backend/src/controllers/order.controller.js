import mongoose from "mongoose";
import OrderModel, { RETURN_WINDOW_DAYS, STATUS_FLOW } from "../models/order.model.js";
import TransactionModel from "../models/transaction.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import CouponModel from "../models/coupon.model.js";
import UserModel from "../models/user.model.js";
import { priceOrder, SHIPPING } from "../utils/money.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import {
    getRazorpay, razorpayConfigured, verifyPaymentSignature, verifyWebhookSignature
} from "../utils/razorpay.js";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../utils/sendEmail.js";
import {
    sendBadRequest, sendCreated, sendForbidden, sendNotFound,
    sendServerError, sendSuccess
} from "../utils/response.js";

// Statuses a customer may still cancel from — once it is with the courier,
// cancelling becomes a return instead.
const CANCELLABLE = new Set(["pending", "confirmed", "packed"]);

// Reaching one of these means the goods are coming back, so reserved stock goes
// back to the shelf and any money taken is owed to the customer.
const REVERSING = new Set(["cancelled", "returned", "refunded"]);

// Writes one immutable row into the money ledger. Never allowed to fail the
// request it belongs to: a missing ledger row is a reporting problem, while a
// rejected order because of one is a lost sale.
const recordTransaction = async (order, fields) => {
    try {
        return await TransactionModel.create({
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            amount: order.total,
            method: order.paymentMethod,
            provider: order.paymentMethod === "razorpay" ? "razorpay" : "",
            ...fields
        });
    } catch (error) {
        // A duplicate providerPaymentId means this payment was already
        // recorded — exactly what the unique index is there to guarantee.
        if (error?.code !== 11000) console.warn("[ledger]", error?.message || error);
        return null;
    }
};

// Marks money as owed back and puts the goods back on the shelf. Used by a
// customer cancellation, an admin refund and a completed return alike.
const reverseOrder = async (order, { note = "", status = "refunded" } = {}) => {
    await releaseStock(order);
    if (order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
        await recordTransaction(order, {
            kind: "refund",
            status: "success",
            settledAt: new Date(),
            note: note || `Refund for ${status}`,
            meta: { originalPaymentId: order.payment.razorpayPaymentId || null }
        });
    } else {
        // Nothing was ever collected (an unpaid COD, or an abandoned online
        // order) — close the open charge rather than inventing a refund.
        await TransactionModel.updateMany(
            { orderId: order._id, kind: "payment", status: "pending" },
            { $set: { status: "failed", note: note || `Order ${status}` } }
        );
    }
};

const pushTimeline = (order, status, note = "") => {
    order.timeline.push({ status, note, at: new Date() });
};

// Resolves the requested cart lines against the live catalogue and prices them
// here. Anything the client claimed about price is ignored.
const buildLineItems = async (items) => {
    const ids = [...new Set(items.map((item) => item.productId))];
    const products = await ProductModel.find({ _id: { $in: ids }, status: true }).lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = [];
    const problems = [];

    for (const item of items) {
        const product = byId.get(String(item.productId));
        if (!product) {
            problems.push("One of the products is no longer available");
            continue;
        }

        let price = product.salePrice;
        let available = product.stockQty;
        let variantLabel = "";

        if (product.variants?.length) {
            const variant = product.variants.find((v) => v.key === item.variantKey);
            if (!variant) {
                problems.push(`Choose an option for ${product.name}`);
                continue;
            }
            price = variant.salePrice;
            available = variant.stockQty;
            variantLabel = variant.label;
        }

        if (available < item.quantity) {
            problems.push(
                available === 0
                    ? `${product.name} is out of stock`
                    : `Only ${available} left of ${product.name}`
            );
            continue;
        }

        lines.push({
            productId: product._id,
            variantKey: item.variantKey || "",
            variantLabel,
            name: product.name,
            slug: product.slug,
            image: product.thumbnail || product.images?.[0] || null,
            price,
            quantity: item.quantity,
            lineTotal: price * item.quantity
        });
    }

    return { lines, problems };
};

const resolveCoupon = async (code, subtotal) => {
    if (!code) return { discount: 0, coupon: null };

    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), status: true });
    if (!coupon) return { discount: 0, coupon: null, error: "That code is not valid" };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return { discount: 0, coupon: null, error: "That code has expired" };
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return { discount: 0, coupon: null, error: "That code has been fully redeemed" };
    }
    if (subtotal < coupon.minOrderValue) {
        return {
            discount: 0,
            coupon: null,
            error: `Spend at least ₹${coupon.minOrderValue.toLocaleString("en-IN")} to use this code`
        };
    }
    return { discount: coupon.discountFor(subtotal), coupon };
};

// Decrements stock for every line, once. Guarded by stockCommitted so a
// retried webhook or a double-clicked confirm can never take units twice.
const commitStock = async (order) => {
    if (order.stockCommitted) return;
    for (const line of order.items) {
        if (line.variantKey) {
            await ProductModel.updateOne(
                { _id: line.productId, "variants.key": line.variantKey },
                { $inc: { "variants.$.stockQty": -line.quantity } }
            );
        } else {
            await ProductModel.updateOne(
                { _id: line.productId },
                { $inc: { stockQty: -line.quantity } }
            );
        }
        // Re-save through the model so the derived `stock` boolean stays true.
        const product = await ProductModel.findById(line.productId);
        if (product) await product.save();
    }
    order.stockCommitted = true;
};

const releaseStock = async (order) => {
    if (!order.stockCommitted) return;
    for (const line of order.items) {
        if (line.variantKey) {
            await ProductModel.updateOne(
                { _id: line.productId, "variants.key": line.variantKey },
                { $inc: { "variants.$.stockQty": line.quantity } }
            );
        } else {
            await ProductModel.updateOne(
                { _id: line.productId },
                { $inc: { stockQty: line.quantity } }
            );
        }
        const product = await ProductModel.findById(line.productId);
        if (product) await product.save();
    }
    order.stockCommitted = false;
};

const notify = (fn, ...args) => {
    // Mail must never fail the request it belongs to.
    Promise.resolve()
        .then(() => fn(...args))
        .catch((error) => console.warn("[mail]", error?.message || error));
};

// Opens a Razorpay order for an unpaid order and stores its id. Returns the
// handful of fields the browser checkout needs, or null when Razorpay is
// unreachable / misconfigured — the caller decides what to tell the customer.
const openRazorpayOrder = async (order) => {
    const razorpay = await getRazorpay();
    if (!razorpay) return null;

    try {
        const created = await razorpay.orders.create({
            // Totals are whole rupees (see utils/money.js); round anyway because
            // Razorpay rejects a non-integer paise amount outright.
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: order.orderNumber,
            notes: { orderId: String(order._id) }
        });
        order.payment.razorpayOrderId = created.id;
        await order.save();
        return {
            orderId: created.id,
            amount: created.amount,
            currency: created.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        };
    } catch (error) {
        // Bad keys, a blocked account or a network blip — all look the same to
        // the shopper, and none of them should surface as a 500.
        console.error("[razorpay] orders.create failed:", error?.error?.description || error?.message || error);
        return null;
    }
};

// Everything that must happen once a payment is genuinely settled. Shared by
// the browser handshake and the webhook, and safe to run twice: an order that
// is already paid short-circuits, and stock is guarded by stockCommitted.
const settlePaidOrder = async (order, { paymentId, signature = "" }) => {
    if (order.paymentStatus === "paid") return false;

    order.paymentStatus = "paid";
    order.payment.razorpayPaymentId = paymentId;
    if (signature) order.payment.razorpaySignature = signature;
    order.payment.paidAt = new Date();
    order.status = "confirmed";
    pushTimeline(order, "confirmed", "Payment received");
    await commitStock(order);
    await order.save();

    if (order.couponCode) {
        await CouponModel.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }
    await UserModel.updateOne({ _id: order.userId }, { $set: { cart: [] } });

    await recordTransaction(order, {
        kind: "payment",
        status: "success",
        settledAt: order.payment.paidAt,
        providerOrderId: order.payment.razorpayOrderId,
        providerPaymentId: paymentId,
        note: "Razorpay payment captured"
    });

    notify(sendOrderConfirmationEmail, order.email, order);
    return true;
};

/* ------------------------------------------------------------------ */
/* customer                                                            */
/* ------------------------------------------------------------------ */

// The reply shape for one order, so a first request and a replayed one are
// byte-for-byte the same thing to the browser.
const orderCreatedPayload = (order, razorpay) => ({
    order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status
    },
    razorpay
});

const create = async (req, res) => {
    try {
        // A repeat of an attempt already accepted: answer with that order
        // instead of charging the customer a second time. The Razorpay block is
        // rebuilt from what was stored, so a retried checkout reopens the same
        // payment rather than creating a rival one.
        if (req.existingOrder) {
            const existing = req.existingOrder;
            const razorpay = existing.paymentMethod === "razorpay" && existing.payment.razorpayOrderId
                ? {
                    orderId: existing.payment.razorpayOrderId,
                    amount: Math.round(existing.total * 100),
                    currency: "INR",
                    keyId: process.env.RAZORPAY_KEY_ID
                }
                : null;
            return sendCreated(res, "Order already placed", orderCreatedPayload(existing, razorpay));
        }

        const { items, addressId, address, shippingMethod, paymentMethod, couponCode } = req.body;

        const user = await UserModel.findById(req.userId).select("email firstName lastName");
        if (!user) return sendForbidden(res, "Please sign in to place an order");

        const { lines, problems } = await buildLineItems(items);
        if (problems.length) return sendBadRequest(res, problems[0]);
        if (!lines.length) return sendBadRequest(res, "Your cart is empty");

        // Delivery address: an existing saved one, or a new one supplied inline.
        let shippingAddress = null;
        if (addressId) {
            const saved = await AddressModel.findOne({ _id: addressId, userId: req.userId }).lean();
            if (!saved) return sendNotFound(res, "That address could not be found");
            shippingAddress = {
                fullName: saved.fullName, phone: saved.phone, line1: saved.line1,
                line2: saved.line2, city: saved.city, state: saved.state,
                pincode: saved.pincode, country: saved.country
            };
        } else {
            const { saveAddress, label, ...rest } = address;
            shippingAddress = rest;
            if (saveAddress) {
                const count = await AddressModel.countDocuments({ userId: req.userId });
                await AddressModel.create({
                    ...rest, label: label || "Home", userId: req.userId, isDefault: count === 0
                });
            }
        }

        const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const { discount, coupon, error } = await resolveCoupon(couponCode, subtotal);
        if (error) return sendBadRequest(res, error);

        const amounts = priceOrder({ subtotal, shippingMethod, discount });

        if (paymentMethod === "razorpay" && !razorpayConfigured()) {
            return sendBadRequest(res, "Online payment is not available right now. Please choose Cash on Delivery.");
        }

        const order = new OrderModel({
            orderNumber: await generateOrderNumber(),
            userId: req.userId,
            email: user.email,
            items: lines,
            shippingAddress,
            ...amounts,
            couponCode: coupon ? coupon.code : "",
            shippingMethod,
            paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            idempotencyKey: req.idempotencyKey || null
        });
        pushTimeline(order, "pending", "Order created");

        // Saved BEFORE anything is deducted. This first write is what claims the
        // idempotency key, so racing duplicates are turned away here — while
        // they still cannot have touched the inventory. Taking the stock first
        // and saving afterwards drains it once per click and keeps only one
        // order to show for it.
        try {
            await order.save();
        } catch (error) {
            // Two requests with the same key raced past the lookup: the unique
            // index settles it, and the loser reads back the winner's order.
            if (error?.code === 11000 && req.idempotencyKey) {
                const winner = await OrderModel.findOne({
                    userId: req.userId, idempotencyKey: req.idempotencyKey
                });
                if (winner) return sendCreated(res, "Order already placed", orderCreatedPayload(winner, null));
            }
            throw error;
        }

        // Only the request that owns the order gets this far, so cash on
        // delivery can now be confirmed and the units taken exactly once.
        if (paymentMethod === "cod") {
            order.status = "confirmed";
            pushTimeline(order, "confirmed", "Cash on delivery accepted");
            await commitStock(order);
            if (coupon) await CouponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
            await order.save();
        }

        let razorpayOrder = null;
        if (paymentMethod === "razorpay") {
            razorpayOrder = await openRazorpayOrder(order);
            if (!razorpayOrder) {
                // The order row stays as a pending record the shopper can retry
                // or cancel; it just never became payable.
                pushTimeline(order, "pending", "Could not open the payment window");
                await order.save();
                return sendBadRequest(res, "We could not start that payment. Please try again or choose Cash on Delivery.");
            }
        } else {
            // COD opens the charge but does not settle it — the cash arrives at
            // the door, so the row stays pending until the order is delivered.
            await recordTransaction(order, {
                kind: "payment",
                status: "pending",
                note: "Cash on delivery — collect on handover"
            });
            notify(sendOrderConfirmationEmail, user.email, order);
            await UserModel.updateOne({ _id: req.userId }, { $set: { cart: [] } });
        }

        return sendCreated(
            res,
            paymentMethod === "cod" ? "Order placed" : "Order created",
            orderCreatedPayload(order, razorpayOrder)
        );
    } catch (error) {
        return sendServerError(res, error);
    }
};

// The single gate that turns an online payment into a confirmed order.
const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const order = await OrderModel.findOne({ _id: orderId, userId: req.userId });
        if (!order) return sendNotFound(res, "Order not found");
        if (order.paymentStatus === "paid") {
            return sendSuccess(res, "Payment already confirmed", { order: { _id: order._id, orderNumber: order.orderNumber } });
        }
        if (order.payment.razorpayOrderId !== razorpayOrderId) {
            return sendBadRequest(res, "This payment does not belong to that order");
        }

        const valid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature: razorpaySignature });
        if (!valid) {
            order.paymentStatus = "failed";
            pushTimeline(order, "pending", "Payment signature verification failed");
            await order.save();
            await recordTransaction(order, {
                kind: "payment",
                status: "failed",
                providerOrderId: razorpayOrderId,
                note: "Signature verification failed"
            });
            return sendBadRequest(res, "We could not verify that payment. You have not been charged.");
        }

        await settlePaidOrder(order, { paymentId: razorpayPaymentId, signature: razorpaySignature });

        return sendSuccess(res, "Payment confirmed", {
            order: { _id: order._id, orderNumber: order.orderNumber }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Re-opens payment for an order the shopper abandoned at the Razorpay window.
// Without this the "you can pay for it from My Orders" promise is empty and
// every dismissed checkout leaves a dead pending order behind.
const retryPayment = async (req, res) => {
    try {
        const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId });
        if (!order) return sendNotFound(res, "Order not found");
        if (order.paymentMethod !== "razorpay") {
            return sendBadRequest(res, "That order is not an online payment");
        }
        if (order.paymentStatus === "paid") return sendBadRequest(res, "That order is already paid");
        if (order.status === "cancelled" || order.status === "refunded") {
            return sendBadRequest(res, "That order has been cancelled");
        }

        // Re-price nothing: the customer pays the total the order was created
        // with. Stock is only re-checked, so an order cannot be paid for goods
        // that sold out in the meantime.
        const { problems } = await buildLineItems(order.items.map((line) => ({
            productId: String(line.productId),
            variantKey: line.variantKey,
            quantity: line.quantity
        })));
        if (problems.length) return sendBadRequest(res, problems[0]);

        if (!razorpayConfigured()) {
            return sendBadRequest(res, "Online payment is unavailable right now");
        }

        // A fresh Razorpay order each attempt — an expired one cannot be reused.
        const razorpay = await openRazorpayOrder(order);
        if (!razorpay) {
            return sendBadRequest(res, "We could not start that payment. Please try again shortly.");
        }
        order.paymentStatus = "pending";
        await order.save();

        return sendSuccess(res, "Payment reopened", {
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                total: order.total
            },
            razorpay
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Razorpay's own callback. The browser handshake is best-effort — a shopper who
// pays and then closes the tab never reaches it — so this is what actually
// guarantees a paid order gets confirmed. Mounted with a raw body parser in
// app.js because the signature covers the exact bytes Razorpay sent.
const razorpayWebhook = async (req, res) => {
    try {
        const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body || {});
        const signature = req.get("x-razorpay-signature");

        if (!verifyWebhookSignature(raw, signature)) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        const event = JSON.parse(raw);
        const payment = event?.payload?.payment?.entity;
        if (!payment) return res.status(200).json({ success: true, message: "Ignored" });

        // notes.orderId is set when the Razorpay order is opened; fall back to
        // the razorpay order id in case an older order predates that.
        const orderId = payment.notes?.orderId;
        const order = orderId
            ? await OrderModel.findById(orderId)
            : await OrderModel.findOne({ "payment.razorpayOrderId": payment.order_id });

        if (!order) return res.status(200).json({ success: true, message: "No matching order" });

        if (event.event === "payment.captured") {
            await settlePaidOrder(order, { paymentId: payment.id });
        } else if (event.event === "payment.failed" && order.paymentStatus !== "paid") {
            order.paymentStatus = "failed";
            pushTimeline(order, "pending", payment.error_description || "Payment failed");
            await order.save();
        }

        // Always 200 on a signed event — a non-2xx makes Razorpay retry, and a
        // handled-but-uninteresting event is not a failure.
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[razorpay webhook]", error?.message || error);
        return res.status(200).json({ success: true });
    }
};

const myOrders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const [orders, total] = await Promise.all([
            OrderModel.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            OrderModel.countDocuments({ userId: req.userId })
        ]);

        return sendSuccess(res, "Orders", {
            orders,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const myOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const where = mongoose.isValidObjectId(id)
            ? { _id: id, userId: req.userId }
            : { orderNumber: id, userId: req.userId };

        const order = await OrderModel.findOne(where).lean();
        if (!order) return sendNotFound(res, "Order not found");

        return sendSuccess(res, "Order", { order });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findOne({ _id: id, userId: req.userId });
        if (!order) return sendNotFound(res, "Order not found");
        if (!CANCELLABLE.has(order.status)) {
            return sendBadRequest(res, `An order that is already ${order.status} cannot be cancelled here. Please contact support.`);
        }

        order.cancelReason = req.body.reason || "Cancelled by customer";
        await reverseOrder(order, { note: order.cancelReason, status: "cancelled" });
        order.status = "cancelled";
        pushTimeline(order, "cancelled", order.cancelReason);
        await order.save();

        return sendSuccess(res, "Order cancelled");
    } catch (error) {
        return sendServerError(res, error);
    }
};

// A customer asking for an order to come back. This only records the request —
// the goods have not moved and no money changes hands until someone at the shop
// marks it `returned`, which is what actually triggers the refund.
const requestReturn = async (req, res) => {
    try {
        const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId });
        if (!order) return sendNotFound(res, "Order not found");

        if (order.status === "return_requested") {
            return sendBadRequest(res, "A return for this order is already being reviewed");
        }
        if (order.status === "returned" || order.status === "refunded") {
            return sendBadRequest(res, "This order has already been returned");
        }
        if (order.status !== "delivered") {
            return sendBadRequest(res, "Only a delivered order can be returned");
        }

        // Measured from delivery, falling back to the order date for the few
        // older orders delivered before deliveredAt existed.
        const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt;
        const daysSince = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 86400000);
        if (daysSince > RETURN_WINDOW_DAYS) {
            return sendBadRequest(
                res,
                `Returns close ${RETURN_WINDOW_DAYS} days after delivery. This order was delivered ${daysSince} days ago — please contact support.`
            );
        }

        order.status = "return_requested";
        order.returnReason = req.body.reason || "Return requested by customer";
        order.returnRequestedAt = new Date();
        pushTimeline(order, "return_requested", order.returnReason);
        await order.save();

        notify(sendOrderStatusEmail, order.email, order);
        return sendSuccess(res, "Return requested — we will be in touch to arrange the pickup", {
            order: { _id: order._id, status: order.status }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// The customer's own money trail for one order.
const myOrderTransactions = async (req, res) => {
    try {
        const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId }).select("_id").lean();
        if (!order) return sendNotFound(res, "Order not found");

        const transactions = await TransactionModel.find({ orderId: order._id })
            .sort({ createdAt: 1 })
            .lean();

        return sendSuccess(res, "Transactions", { transactions });
    } catch (error) {
        return sendServerError(res, error);
    }
};

/* ------------------------------------------------------------------ */
/* admin                                                               */
/* ------------------------------------------------------------------ */

const adminList = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
        if (req.query.q) {
            const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { orderNumber: new RegExp(safe, "i") },
                { email: new RegExp(safe, "i") }
            ];
        }

        const [orders, total] = await Promise.all([
            OrderModel.find(filter)
                .populate({ path: "userId", select: "firstName lastName email" })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            OrderModel.countDocuments(filter)
        ]);

        return sendSuccess(res, "Orders", {
            orders,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const adminOrderById = async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id)
            .populate({ path: "userId", select: "firstName lastName email phone" })
            .lean();
        if (!order) return sendNotFound(res, "Order not found");

        // The ledger travels with the order here: whoever is looking at a
        // disputed payment wants both on one screen.
        const transactions = await TransactionModel.find({ orderId: order._id })
            .sort({ createdAt: 1 })
            .lean();

        return sendSuccess(res, "Order", { order, transactions });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const adminUpdateStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const order = await OrderModel.findById(req.params.id);
        if (!order) return sendNotFound(res, "Order not found");
        if (order.status === status) return sendBadRequest(res, `This order is already ${status}`);

        // Cancelled, returned or refunded all mean the goods come back and any
        // money taken is owed — one path handles the stock and the ledger.
        if (REVERSING.has(status)) {
            await reverseOrder(order, { note, status });
        }

        // Confirming an order that skipped the paid path (e.g. manual COD entry)
        // must still take the stock.
        if (status === "confirmed") await commitStock(order);

        if (status === "delivered") {
            order.deliveredAt = new Date();
            if (order.paymentMethod === "cod") {
                order.paymentStatus = "paid";
                // The cash is in hand now, so the charge opened at checkout
                // finally settles.
                const settled = await TransactionModel.updateOne(
                    { orderId: order._id, kind: "payment", status: "pending" },
                    { $set: { status: "success", settledAt: new Date(), note: "Cash collected on delivery" } }
                );
                // No open row (an order created before the ledger existed) —
                // write one so the day's takings still add up.
                if (!settled.modifiedCount) {
                    await recordTransaction(order, {
                        kind: "payment",
                        status: "success",
                        settledAt: new Date(),
                        note: "Cash collected on delivery"
                    });
                }
            }
        }

        order.status = status;
        pushTimeline(order, status, note || "");
        await order.save();

        notify(sendOrderStatusEmail, order.email, order);
        return sendSuccess(res, `Order marked ${status.replace(/_/g, " ")}`);
    } catch (error) {
        return sendServerError(res, error);
    }
};

// The whole money ledger, filterable — the screen a shop looks at when it wants
// to know what actually came in this month rather than what was ordered.
const adminTransactions = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        const filter = {};
        if (req.query.kind) filter.kind = req.query.kind;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.method) filter.method = req.query.method;
        if (req.query.q) {
            const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { orderNumber: new RegExp(safe, "i") },
                { providerPaymentId: new RegExp(safe, "i") }
            ];
        }

        const [transactions, total, totals] = await Promise.all([
            TransactionModel.find(filter)
                .populate({ path: "userId", select: "firstName lastName email" })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            TransactionModel.countDocuments(filter),
            // Settled money only — pending COD is not income until it is cash.
            TransactionModel.aggregate([
                { $match: { ...filter, status: "success" } },
                { $group: { _id: "$kind", amount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ])
        ]);

        const collected = totals.find((t) => t._id === "payment")?.amount || 0;
        const refunded = totals.find((t) => t._id === "refund")?.amount || 0;

        return sendSuccess(res, "Transactions", {
            transactions,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1),
            summary: { collected, refunded, net: collected - refunded }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

export {
    create,
    verifyPayment,
    retryPayment,
    razorpayWebhook,
    myOrders,
    myOrderById,
    myOrderTransactions,
    cancelOrder,
    requestReturn,
    adminList,
    adminOrderById,
    adminUpdateStatus,
    adminTransactions,
    SHIPPING
};
