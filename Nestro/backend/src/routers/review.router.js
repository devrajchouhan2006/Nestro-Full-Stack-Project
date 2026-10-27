import express from "express";
import { remove, featured } from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Listing and creating live under /api/product/:productId/reviews.
router.get("/featured", featured);
router.delete("/:id", verifyToken, remove);

export default router;
