import OrderModel from "../models/order.model.js";
import { sendBadRequest } from "../utils/response.js";

// Guards order creation against being run twice for the same intent.
//
// A rate limiter only slows a second request down; it does not know that the
// second one *means the same thing* as the first. A double-clicked button, a
// retried fetch after a flaky connection, or a browser replaying a request on
// reconnect all look like two perfectly valid orders to the server. The client
// sends one id per checkout attempt, and that id is what tells them apart.
//
// This middleware never answers the request itself — it hands the already
// existing order to the controller, which knows how to build the full reply
// (including the Razorpay parameters an online order needs).
const checkIdempotency = async (req, res, next) => {
    try {
        const key = (req.get("Idempotency-Key") || "").trim();

        if (!key) {
            return sendBadRequest(res, "Idempotency-Key header is required to place an order");
        }
        if (key.length > 100) {
            return sendBadRequest(res, "That Idempotency-Key is too long");
        }

        req.idempotencyKey = key;
        // Scoped to the user: two shoppers generating the same uuid (vanishingly
        // unlikely, but free to rule out) must not collide.
        req.existingOrder = await OrderModel.findOne({ userId: req.userId, idempotencyKey: key });

        return next();
    } catch (error) {
        return next(error);
    }
};

export default checkIdempotency;
