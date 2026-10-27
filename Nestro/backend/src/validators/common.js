import { z } from "zod";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "must be a valid id");
export const email = z.string().trim().toLowerCase().email("must be a valid email");
export const phone = z.string().trim().regex(/^[+]?[0-9\s-]{7,15}$/, "must be a valid phone number");
export const pincode = z.string().trim().regex(/^[1-9][0-9]{5}$/, "must be a valid 6-digit PIN code");
export const otpCode = z.string().trim().regex(/^[0-9]{6}$/, "must be a 6-digit code");
export const password = z.string().min(8, "must be at least 8 characters").max(72, "is too long");
export const shortText = (max = 120) => z.string().trim().min(1, "is required").max(max);
export const optionalText = (max = 2000) => z.string().trim().max(max).optional().or(z.literal(""));
export const money = z.coerce.number().nonnegative("cannot be negative");
export const count = z.coerce.number().int().nonnegative("cannot be negative");
export const bool = z.union([z.boolean(), z.enum(["true", "false"])]).transform((v) => v === true || v === "true");
