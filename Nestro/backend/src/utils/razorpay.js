import crypto from "crypto";

// Razorpay's SDK is optional at boot: the app must still run (COD only) when
// keys are absent, so the client is created lazily and never at import time.
let cached = null;

export const razorpayConfigured = () =>
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const getRazorpay = async () => {
    if (!razorpayConfigured()) return null;
    if (cached) return cached;
    try {
        const { default: Razorpay } = await import("razorpay");
        cached = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        return cached;
    } catch (error) {
        console.error("[razorpay] SDK not installed — run: npm i razorpay");
        return null;
    }
};

// The only thing that proves a payment happened. Never trust the browser's
// success callback on its own.
export const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, signature }) => {
    if (!process.env.RAZORPAY_KEY_SECRET) return false;
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature || "")));
    } catch {
        return false;
    }
};

// Webhook bodies are signed with a different secret than the checkout handshake.
export const verifyWebhookSignature = (rawBody, signature) => {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature || "")));
    } catch {
        return false;
    }
};
