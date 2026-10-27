import express from "express";
import { apply, list, create, update, remove } from "../controllers/coupon.controller.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { applyCouponSchema, couponSchema } from "../validators/catalog.validator.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/apply", verifyToken, writeLimiter, validate(applyCouponSchema), apply);

router.get("/", requireAdmin, list);
router.post("/", requireAdmin, validate(couponSchema), create);
router.put("/:id", requireAdmin, validate(couponSchema.partial()), update);
router.delete("/:id", requireAdmin, remove);

export default router;
