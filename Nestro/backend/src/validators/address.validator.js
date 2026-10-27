import { z } from "zod";
import { phone, pincode, shortText } from "./common.js";

export const addressSchema = z.object({
    label: z.enum(["Home", "Office", "Other"]).default("Home"),
    fullName: shortText(60),
    phone,
    line1: shortText(120),
    line2: z.string().trim().max(120).optional().default(""),
    city: shortText(60),
    state: shortText(60),
    pincode,
    country: z.string().trim().max(60).optional().default("India"),
    isDefault: z.boolean().optional().default(false)
});
