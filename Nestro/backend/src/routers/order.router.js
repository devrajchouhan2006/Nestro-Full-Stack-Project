import express from "express";
import {
    create, verifyPayment, retryPayment, myOrders, myOrderById, myOrderTransactions,
    cancelOrder, requestReturn,
    adminList, adminOrderById, adminUpdateStatus, adminTransactions
} from "../controllers/order.controller.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import checkIdempotency from "../middleware/idempotency.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import {
    createOrderSchema, verifyPaymentSchema, cancelOrderSchema,
    returnOrderSchema, updateOrderStatusSchema
} from "../validators/order.validator.js";

const router = express.Router();

/* admin — declared first so "/admin/..." is never eaten by "/:id" */
router.get("/admin/all", requireAdmin, adminList);
router.get("/admin/transactions", requireAdmin, adminTransactions);
router.get("/admin/:id", requireAdmin, adminOrderById);
router.patch("/admin/:id/status", requireAdmin, validate(updateOrderStatusSchema), adminUpdateStatus);

/* customer */
// checkIdempotency runs before validation so a replayed request is answered
// from the existing order without re-checking a cart that may since have moved.
router.post("/create", verifyToken, writeLimiter, checkIdempotency, validate(createOrderSchema), create);
router.post("/verify-payment", verifyToken, validate(verifyPaymentSchema), verifyPayment);
// Re-opens the Razorpay window for an order abandoned at the payment step.
router.post("/:id/pay", verifyToken, writeLimiter, retryPayment);
router.get("/", verifyToken, myOrders);
router.get("/:id", verifyToken, myOrderById);
router.get("/:id/transactions", verifyToken, myOrderTransactions);
router.patch("/:id/cancel", verifyToken, validate(cancelOrderSchema), cancelOrder);
router.patch("/:id/return", verifyToken, writeLimiter, validate(returnOrderSchema), requestReturn);

export default router;
