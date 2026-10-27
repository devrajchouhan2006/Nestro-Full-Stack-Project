import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: "" },
    comment: { type: String, trim: true, default: "" },
    // Set when the reviewer has a delivered order containing this product.
    verifiedPurchase: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
}, { timestamps: true });

// One review per product per shopper.
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const ReviewModel = mongoose.model("Review", ReviewSchema);
export default ReviewModel;
