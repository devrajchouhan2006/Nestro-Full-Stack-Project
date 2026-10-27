import express from "express";
import {
    updateProfile, changePassword, stats,
    getCart, syncCart, getWishlist, syncWishlist
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { updateProfileSchema, changePasswordSchema } from "../validators/auth.validator.js";
import { cartSyncSchema, wishlistSyncSchema } from "../validators/catalog.validator.js";

const router = express.Router();
router.use(verifyToken);

router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/password", validate(changePasswordSchema), changePassword);
router.get("/stats", stats);

router.get("/cart", getCart);
router.put("/cart", validate(cartSyncSchema), syncCart);
router.get("/wishlist", getWishlist);
router.put("/wishlist", validate(wishlistSyncSchema), syncWishlist);

export default router;
