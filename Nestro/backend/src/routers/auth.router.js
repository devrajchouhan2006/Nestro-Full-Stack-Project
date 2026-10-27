import express from "express";
import {
    signup, verifyOtp, resendOtp, signin, adminSignin,
    forgotPassword, resetPassword, logout, me
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.js";
import {
    signupSchema, signinSchema, verifyOtpSchema, emailOnlySchema, resetPasswordSchema
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/verify-otp", otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", authLimiter, validate(emailOnlySchema), resendOtp);
router.post("/signin", authLimiter, validate(signinSchema), signin);
router.post("/admin/signin", authLimiter, validate(signinSchema), adminSignin);
router.post("/forgot-password", authLimiter, validate(emailOnlySchema), forgotPassword);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/logout", logout);
router.get("/me", verifyToken, me);

export default router;
