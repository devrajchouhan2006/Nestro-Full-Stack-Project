import CouponModel from "../models/coupon.model.js";
import {
    sendBadRequest, sendCreated, sendNotFound, sendServerError, sendSuccess
} from "../utils/response.js";

// Public: tells checkout what a code is worth, without reserving it.
const apply = async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        const coupon = await CouponModel.findOne({ code: code.toUpperCase(), status: true });
        if (!coupon) return sendBadRequest(res, "That code is not valid");
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return sendBadRequest(res, "That code has expired");
        }
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return sendBadRequest(res, "That code has been fully redeemed");
        }
        if (subtotal < coupon.minOrderValue) {
            return sendBadRequest(
                res,
                `Spend at least ₹${coupon.minOrderValue.toLocaleString("en-IN")} to use this code`
            );
        }

        return sendSuccess(res, "Code applied", {
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discount: coupon.discountFor(subtotal)
            }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const list = async (req, res) => {
    try {
        const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
        return sendSuccess(res, "Coupons", { coupons });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const create = async (req, res) => {
    try {
        const payload = { ...req.body, code: req.body.code.toUpperCase() };
        if (payload.expiresAt) payload.expiresAt = new Date(payload.expiresAt);

        const existing = await CouponModel.findOne({ code: payload.code });
        if (existing) return sendBadRequest(res, "That code already exists");

        const coupon = await CouponModel.create(payload);
        return sendCreated(res, "Coupon created", { coupon });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const update = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.code) payload.code = payload.code.toUpperCase();
        if (payload.expiresAt) payload.expiresAt = new Date(payload.expiresAt);

        const coupon = await CouponModel.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true, runValidators: true }
        );
        if (!coupon) return sendNotFound(res, "Coupon not found");
        return sendSuccess(res, "Coupon updated", { coupon });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const remove = async (req, res) => {
    try {
        const coupon = await CouponModel.findByIdAndDelete(req.params.id);
        if (!coupon) return sendNotFound(res, "Coupon not found");
        return sendSuccess(res, "Coupon removed");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { apply, list, create, update, remove };
