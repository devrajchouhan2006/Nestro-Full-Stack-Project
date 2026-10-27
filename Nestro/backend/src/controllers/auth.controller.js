import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { sendOtpEmail, sendResetEmail } from "../utils/sendEmail.js";
import {
    sendBadRequest, sendConflict, sendCreated, sendForbidden,
    sendNotFound, sendServerError, sendSuccess, sendUnauthorized
} from "../utils/response.js";

const OTP_EXPIRY_MS = (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// In development an unconfigured mailbox logs the code instead of failing the
// whole signup. In production a mail failure is a real failure.
const deliverCode = async (email, code, kind = "otp") => {
    try {
        if (kind === "reset") await sendResetEmail(email, code);
        else await sendOtpEmail(email, code);
        return true;
    } catch (error) {
        if (process.env.NODE_ENV === "production") throw error;
        console.warn(`[auth] Could not email ${kind} to ${email} (check EMAIL_USER/EMAIL_PASS). Code: ${code}`);
        return false;
    }
};

const setAuthCookie = (res, user) => {
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        // A production frontend on a different origin needs SameSite=None,
        // which browsers only honour on a Secure cookie.
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/"
    });
};

const clearAuthCookie = (res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    });
};

const toSafeUser = (user) => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    dob: user.dob || null,
    gender: user.gender || "",
    role: user.role,
    isVerified: user.isVerified
});

const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        const existing = await UserModel.findOne({ email });
        if (existing) {
            // An unverified stub from an abandoned signup should not lock the
            // address forever — refresh the code and let them continue.
            if (!existing.isVerified) {
                const otp = generateOtp();
                existing.password = await bcrypt.hash(password, 10);
                existing.firstName = firstName;
                existing.lastName = lastName || "";
                existing.phone = phone || "";
                existing.otp = { code: otp, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), attempts: 0 };
                await existing.save();
                await deliverCode(email, otp);
                return sendCreated(res, "Account created. Please verify the OTP sent to your email");
            }
            return sendConflict(res, "An account with this email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();

        await UserModel.create({
            firstName,
            lastName: lastName || "",
            email,
            password: hashedPassword,
            phone: phone || "",
            otp: { code: otp, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), attempts: 0 }
        });

        await deliverCode(email, otp);
        return sendCreated(res, "Account created. Please verify the OTP sent to your email");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) return sendNotFound(res, "Account not found");
        if (user.isVerified) return sendBadRequest(res, "Account is already verified");
        if (!user.otp?.code) return sendBadRequest(res, "No active code. Please request a new one");

        if ((user.otp.attempts || 0) >= MAX_CODE_ATTEMPTS) {
            return sendBadRequest(res, "Too many wrong attempts. Please request a new code");
        }
        if (user.otp.expiresAt < new Date()) {
            return sendBadRequest(res, "OTP has expired, please resend");
        }
        if (user.otp.code !== otp) {
            user.otp.attempts = (user.otp.attempts || 0) + 1;
            await user.save();
            return sendBadRequest(res, "Invalid OTP");
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        setAuthCookie(res, user);
        return sendSuccess(res, "Email verified successfully", { user: toSafeUser(user) });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) return sendNotFound(res, "Account not found");
        if (user.isVerified) return sendBadRequest(res, "Account is already verified");

        const otp = generateOtp();
        user.otp = { code: otp, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), attempts: 0 };
        await user.save();
        await deliverCode(email, otp);

        return sendSuccess(res, "OTP resent successfully");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) return sendBadRequest(res, "Invalid email or password");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return sendBadRequest(res, "Invalid email or password");

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before signing in",
                notVerified: true,
                email: user.email
            });
        }

        setAuthCookie(res, user);
        return sendSuccess(res, "Signed in successfully", { user: toSafeUser(user) });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Same credentials, but refuses anyone without the admin role so the panel
// never shows a half-working session to a normal shopper.
const adminSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) return sendBadRequest(res, "Invalid email or password");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return sendBadRequest(res, "Invalid email or password");
        if (user.role !== "admin") return sendForbidden(res, "This account does not have admin access");

        setAuthCookie(res, user);
        return sendSuccess(res, "Signed in successfully", { user: toSafeUser(user) });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        // Always the same answer, so this endpoint cannot be used to discover
        // which addresses have accounts.
        const generic = "If an account exists for that email, a reset code is on its way";
        if (!user) return sendSuccess(res, generic);

        const code = generateOtp();
        user.reset = { code, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), attempts: 0 };
        await user.save();
        await deliverCode(email, code, "reset");

        return sendSuccess(res, generic);
    } catch (error) {
        return sendServerError(res, error);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user || !user.reset?.code) return sendBadRequest(res, "This reset link is no longer valid");

        if ((user.reset.attempts || 0) >= MAX_CODE_ATTEMPTS) {
            return sendBadRequest(res, "Too many wrong attempts. Please request a new code");
        }
        if (user.reset.expiresAt < new Date()) {
            return sendBadRequest(res, "This code has expired. Please request a new one");
        }
        if (user.reset.code !== code) {
            user.reset.attempts = (user.reset.attempts || 0) + 1;
            await user.save();
            return sendBadRequest(res, "Invalid code");
        }

        user.password = await bcrypt.hash(password, 10);
        user.reset = undefined;
        // A password reset also proves ownership of the mailbox.
        user.isVerified = true;
        await user.save();

        clearAuthCookie(res);
        return sendSuccess(res, "Password updated. Please sign in with your new password");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const logout = async (req, res) => {
    clearAuthCookie(res);
    return sendSuccess(res, "Logged out successfully");
};

const me = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) return sendUnauthorized(res, "Session expired, please sign in again");
        return sendSuccess(res, "Session active", { user: toSafeUser(user) });
    } catch (error) {
        return sendServerError(res, error);
    }
};

export {
    signup,
    verifyOtp,
    resendOtp,
    signin,
    adminSignin,
    forgotPassword,
    resetPassword,
    logout,
    me,
    toSafeUser
};
