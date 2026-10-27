import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["percent", "flat"],
        default: "percent"
    },
    // percent -> 0-100, flat -> rupees
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    status: { type: Boolean, default: true }
}, { timestamps: true });

CouponSchema.methods.discountFor = function (subtotal) {
    if (this.type === "flat") return Math.min(this.value, subtotal);
    const raw = Math.round((subtotal * this.value) / 100);
    if (this.maxDiscount) return Math.min(raw, this.maxDiscount);
    return raw;
};

const CouponModel = mongoose.model("Coupon", CouponSchema);
export default CouponModel;
