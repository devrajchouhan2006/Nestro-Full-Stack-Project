import mongoose from "mongoose";
import ReviewModel from "../models/review.model.js";
import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import {
    sendBadRequest, sendCreated, sendNotFound, sendServerError, sendSuccess
} from "../utils/response.js";

// Recomputes the denormalised rating on the product after any review change.
const refreshProductRating = async (productId) => {
    const agg = await ReviewModel.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(String(productId)), status: true } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    await ProductModel.updateOne(
        { _id: productId },
        {
            $set: {
                ratingAvg: Math.round((agg[0]?.avg || 0) * 10) / 10,
                ratingCount: agg[0]?.count || 0
            }
        }
    );
};

const listForProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const [reviews, breakdown] = await Promise.all([
            ReviewModel.find({ productId, status: true })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            ReviewModel.aggregate([
                { $match: { productId: new mongoose.Types.ObjectId(String(productId)), status: true } },
                { $group: { _id: "$rating", count: { $sum: 1 } } }
            ])
        ]);

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        breakdown.forEach((row) => { counts[row._id] = row.count; });

        return sendSuccess(res, "Reviews", { reviews, counts });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const create = async (req, res) => {
    try {
        const { productId } = req.params;

        const [product, user] = await Promise.all([
            ProductModel.findById(productId).select("_id").lean(),
            UserModel.findById(req.userId).select("firstName lastName").lean()
        ]);
        if (!product) return sendNotFound(res, "Product not found");
        if (!user) return sendNotFound(res, "Account not found");

        const existing = await ReviewModel.findOne({ productId, userId: req.userId });
        if (existing) return sendBadRequest(res, "You have already reviewed this product");

        // Verified badge only when a delivered order actually contains the item.
        const delivered = await OrderModel.findOne({
            userId: req.userId,
            status: "delivered",
            "items.productId": productId
        }).select("_id").lean();

        const review = await ReviewModel.create({
            productId,
            userId: req.userId,
            userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Nestro customer",
            rating: req.body.rating,
            title: req.body.title,
            comment: req.body.comment,
            verifiedPurchase: Boolean(delivered)
        });

        await refreshProductRating(productId);
        return sendCreated(res, "Thanks for your review", { review });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Recent glowing reviews for the homepage. Real customer words, or nothing.
const featured = async (req, res) => {
    try {
        const reviews = await ReviewModel.find({ status: true, rating: { $gte: 4 }, comment: { $ne: "" } })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate({ path: "productId", select: "name" })
            .lean();

        return sendSuccess(res, "Featured reviews", { reviews });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const remove = async (req, res) => {
    try {
        // Owner or admin.
        const filter = req.userRole === "admin"
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: req.userId };

        const review = await ReviewModel.findOneAndDelete(filter);
        if (!review) return sendNotFound(res, "Review not found");

        await refreshProductRating(review.productId);
        return sendSuccess(res, "Review removed");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { listForProduct, create, remove, featured };
