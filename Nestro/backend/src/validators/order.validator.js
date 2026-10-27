import { z } from "zod";
import { objectId } from "./common.js";

// The client sends intent only. Prices, discounts and totals are recomputed
// server-side from the catalogue — nothing about money is trusted from here.
export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: objectId,
        variantKey: z.string().trim().max(60).optional().default(""),
        quantity: z.coerce.number().int().min(1).max(20)
    })).min(1, "your cart is empty"),
    addressId: objectId.optional(),
    address: z.object({
        label: z.enum(["Home", "Office", "Other"]).optional().default("Home"),
        fullName: z.string().trim().min(1).max(60),
        phone: z.string().trim().min(7).max(15),
        line1: z.string().trim().min(1).max(120),
        line2: z.string().trim().max(120).optional().default(""),
        city: z.string().trim().min(1).max(60),
        state: z.string().trim().min(1).max(60),
        pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
        country: z.string().trim().max(60).optional().default("India"),
        saveAddress: z.boolean().optional().default(false)
    }).optional(),
    shippingMethod: z.enum(["standard", "express"]).default("standard"),
    paymentMethod: z.enum(["cod", "razorpay"]),
    couponCode: z.string().trim().max(30).optional().default("")
}).refine((data) => data.addressId || data.address, {
    message: "a delivery address is required",
    path: ["address"]
});

export const verifyPaymentSchema = z.object({
    orderId: objectId,
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1)
});

export const cancelOrderSchema = z.object({
    reason: z.string().trim().max(300).optional().default("")
});

export const returnOrderSchema = z.object({
    reason: z.string().trim().min(3, "Tell us briefly what went wrong").max(300)
});

export const updateOrderStatusSchema = z.object({
    status: z.enum([
        "pending", "confirmed", "packed", "dispatched", "shipped", "out_for_delivery",
        "delivered", "cancelled", "return_requested", "returned", "refunded"
    ]),
    note: z.string().trim().max(300).optional().default("")
});
