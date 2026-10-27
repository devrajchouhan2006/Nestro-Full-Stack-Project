import { z } from "zod";
import { bool, count, money, objectId } from "./common.js";

const variantSchema = z.object({
    key: z.string().trim().min(1).max(60),
    label: z.string().trim().min(1).max(60),
    color: z.string().trim().max(40).optional().default(""),
    size: z.string().trim().max(40).optional().default(""),
    salePrice: money,
    originalPrice: money.optional(),
    stockQty: count.optional().default(0),
    image: z.string().trim().optional().nullable()
});

// Multipart bodies arrive as strings, so everything coerces.
const productBase = {
    roomId: objectId,
    categoryId: objectId,
    name: z.string().trim().min(2).max(140),
    slug: z.string().trim().max(160).optional().or(z.literal("")),
    sku: z.string().trim().max(40).optional().or(z.literal("")),
    originalPrice: money,
    salePrice: money,
    discount: z.coerce.number().min(0).max(100).optional().default(0),
    shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
    description: z.string().trim().max(20000).optional().or(z.literal("")),
    material: z.string().trim().max(60).optional().or(z.literal("")),
    color: z.string().trim().max(40).optional().or(z.literal("")),
    width: z.coerce.number().nonnegative().optional(),
    height: z.coerce.number().nonnegative().optional(),
    depth: z.coerce.number().nonnegative().optional(),
    weight: z.coerce.number().nonnegative().optional(),
    stockQty: count.optional().default(0),
    lowStockThreshold: count.optional().default(3),
    featured: bool.optional(),
    bestSeller: bool.optional(),
    newArrival: bool.optional(),
    status: bool.optional(),
    variants: z.union([z.array(variantSchema), z.string()]).optional()
};

export const createProductSchema = z.object(productBase)
    .refine((d) => d.salePrice <= d.originalPrice, {
        message: "sale price cannot exceed the original price",
        path: ["salePrice"]
    });

export const updateProductSchema = z.object(productBase).partial()
    .refine((d) => d.salePrice === undefined || d.originalPrice === undefined || d.salePrice <= d.originalPrice, {
        message: "sale price cannot exceed the original price",
        path: ["salePrice"]
    });

export const taxonomySchema = z.object({
    name: z.string().trim().min(3).max(20),
    slug: z.string().trim().max(40).optional().or(z.literal("")),
    status: bool.optional()
});

export const reviewSchema = z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(100).optional().default(""),
    comment: z.string().trim().max(1500).optional().default("")
});

export const couponSchema = z.object({
    code: z.string().trim().min(3).max(30),
    type: z.enum(["percent", "flat"]).default("percent"),
    value: money,
    maxDiscount: money.optional().nullable(),
    minOrderValue: money.optional().default(0),
    usageLimit: count.optional().nullable(),
    expiresAt: z.string().trim().optional().nullable(),
    status: bool.optional()
});

export const applyCouponSchema = z.object({
    code: z.string().trim().min(1).max(30),
    subtotal: money
});

export const cartSyncSchema = z.object({
    items: z.array(z.object({
        productId: objectId,
        variantKey: z.string().trim().max(60).optional().default(""),
        quantity: z.coerce.number().int().min(1).max(20)
    })).max(100)
});

export const wishlistSyncSchema = z.object({
    items: z.array(objectId).max(200)
});

export const contactSchema = z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().toLowerCase().email(),
    subject: z.string().trim().max(120).optional().default(""),
    message: z.string().trim().min(10).max(2000)
});

export const newsletterSchema = z.object({
    email: z.string().trim().toLowerCase().email()
});
