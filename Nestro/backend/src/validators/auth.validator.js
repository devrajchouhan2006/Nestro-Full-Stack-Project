import { z } from "zod";
import { email, otpCode, password, phone, shortText } from "./common.js";

export const signupSchema = z.object({
    firstName: shortText(40),
    lastName: z.string().trim().max(40).optional().default(""),
    email,
    password,
    phone: phone.optional().or(z.literal(""))
});

export const signinSchema = z.object({
    email,
    password: z.string().min(1, "is required")
});

export const verifyOtpSchema = z.object({ email, otp: otpCode });
export const emailOnlySchema = z.object({ email });
export const resetPasswordSchema = z.object({ email, code: otpCode, password });

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "is required"),
    newPassword: password
});

export const updateProfileSchema = z.object({
    firstName: shortText(40),
    lastName: z.string().trim().max(40).optional().default(""),
    phone: phone.optional().or(z.literal("")),
    dob: z.string().trim().optional().or(z.literal("")),
    gender: z.enum(["male", "female", "other", ""]).optional().default("")
});
