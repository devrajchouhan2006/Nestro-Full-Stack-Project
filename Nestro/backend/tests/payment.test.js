import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyPaymentSignature } from "../src/utils/razorpay.js";

const SECRET = "test_secret_key";

const sign = (orderId, paymentId) =>
    crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");

test("a correctly signed payment verifies", () => {
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    const signature = sign("order_ABC", "pay_XYZ");
    assert.equal(
        verifyPaymentSignature({
            razorpayOrderId: "order_ABC",
            razorpayPaymentId: "pay_XYZ",
            signature
        }),
        true
    );
});

test("a tampered payment id is rejected", () => {
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    const signature = sign("order_ABC", "pay_XYZ");
    assert.equal(
        verifyPaymentSignature({
            razorpayOrderId: "order_ABC",
            razorpayPaymentId: "pay_ATTACKER",
            signature
        }),
        false
    );
});

test("a missing signature is rejected rather than throwing", () => {
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    assert.equal(
        verifyPaymentSignature({ razorpayOrderId: "o", razorpayPaymentId: "p", signature: null }),
        false
    );
});

test("no secret configured means nothing verifies", () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    assert.equal(
        verifyPaymentSignature({ razorpayOrderId: "o", razorpayPaymentId: "p", signature: "x" }),
        false
    );
});
