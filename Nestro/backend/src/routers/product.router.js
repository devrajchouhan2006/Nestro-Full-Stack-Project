import express from "express";
import {
    create, update, read, facets, readById, statusUpdate,
    statusById, deleteById, addImages, removeImage, suggest
} from "../controllers/product.controller.js";
import { listForProduct, create as createReview } from "../controllers/review.controller.js";
import upload from "../middleware/multer.js";
import { requireAdmin, verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createProductSchema, updateProductSchema, reviewSchema } from "../validators/catalog.validator.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

/* public */
router.get("/", read);
router.get("/facets", facets);
router.get("/suggest", suggest);
router.get("/:productId/reviews", listForProduct);
router.post("/:productId/reviews", verifyToken, writeLimiter, validate(reviewSchema), createReview);
router.get("/:id", readById);

/* admin only */
router.post("/create", requireAdmin, upload.single("image"), validate(createProductSchema), create);
router.put("/edit/:id", requireAdmin, upload.single("image"), validate(updateProductSchema), update);
router.post("/add-images/:id", requireAdmin, upload.array("images", 6), addImages);
router.delete("/remove-image/:id", requireAdmin, removeImage);
router.patch("/status-update/:id", requireAdmin, statusUpdate);
router.patch("/status/:id", requireAdmin, statusById);
router.delete("/delete/:id", requireAdmin, deleteById);

export default router;
