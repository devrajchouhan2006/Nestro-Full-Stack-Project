import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import { toSafeUser } from "./auth.controller.js";
import {
    sendBadRequest, sendNotFound, sendServerError, sendSuccess
} from "../utils/response.js";

const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, dob, gender } = req.body;

        const user = await UserModel.findById(req.userId);
        if (!user) return sendNotFound(res, "Account not found");

        user.firstName = firstName;
        user.lastName = lastName || "";
        user.phone = phone || "";
        user.gender = gender || "";
        user.dob = dob ? new Date(dob) : undefined;
        await user.save();

        return sendSuccess(res, "Profile updated", { user: toSafeUser(user) });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await UserModel.findById(req.userId);
        if (!user) return sendNotFound(res, "Account not found");

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return sendBadRequest(res, "Your current password is not correct");
        if (currentPassword === newPassword) {
            return sendBadRequest(res, "Choose a password different from your current one");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return sendSuccess(res, "Password updated");
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Counts shown on the account sidebar.
const stats = async (req, res) => {
    try {
        const [agg, wishlistCount] = await Promise.all([
            OrderModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(String(req.userId)), status: { $ne: "cancelled" } } },
                { $group: { _id: null, orders: { $sum: 1 }, spent: { $sum: "$total" } } }
            ]),
            UserModel.findById(req.userId).select("wishlist").lean()
        ]);

        return sendSuccess(res, "Stats", {
            stats: {
                orders: agg[0]?.orders || 0,
                spent: agg[0]?.spent || 0,
                wishlist: wishlistCount?.wishlist?.length || 0
            }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

/* -------- server-side cart & wishlist, so a basket follows the account ------ */

const getCart = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId).select("cart").lean();
        const ids = (user?.cart || []).map((line) => line.productId);
        const products = await ProductModel.find({ _id: { $in: ids }, status: true })
            .select("_id name slug thumbnail salePrice variants stockQty")
            .lean();
        const byId = new Map(products.map((p) => [String(p._id), p]));

        // Drop lines whose product has since been removed or hidden.
        const items = (user?.cart || []).flatMap((line) => {
            const product = byId.get(String(line.productId));
            if (!product) return [];
            const variant = product.variants?.find((v) => v.key === line.variantKey);
            return [{
                productId: String(product._id),
                variantKey: line.variantKey || "",
                name: product.name,
                image: variant?.image || product.thumbnail,
                price: variant?.salePrice ?? product.salePrice,
                quantity: line.quantity
            }];
        });

        return sendSuccess(res, "Cart", { items });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const syncCart = async (req, res) => {
    try {
        await UserModel.updateOne(
            { _id: req.userId },
            { $set: { cart: req.body.items } }
        );
        return sendSuccess(res, "Cart saved");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const getWishlist = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId)
            .populate({ path: "wishlist", select: "_id name slug thumbnail salePrice originalPrice" })
            .lean();

        const items = (user?.wishlist || []).map((product) => ({
            productId: String(product._id),
            name: product.name,
            image: product.thumbnail,
            price: product.salePrice
        }));

        return sendSuccess(res, "Wishlist", { items });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const syncWishlist = async (req, res) => {
    try {
        await UserModel.updateOne(
            { _id: req.userId },
            { $set: { wishlist: req.body.items } }
        );
        return sendSuccess(res, "Wishlist saved");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export {
    updateProfile,
    changePassword,
    stats,
    getCart,
    syncCart,
    getWishlist,
    syncWishlist
};
