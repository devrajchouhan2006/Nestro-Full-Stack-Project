import rateLimit from "express-rate-limit";
import { sendTooManyRequests } from "../utils/response.js";

const handler = (message) => (req, res) => sendTooManyRequests(res, message);

// Signup / signin / resend: expensive and abusable, keyed per IP.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handler("Too many attempts. Please try again in 15 minutes.")
});

// OTP and reset-code checks: a six-digit code must not be brute-forceable.
export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handler("Too many code attempts. Please request a new code.")
});

// Writes that cost money or send mail.
export const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handler("You are going a little fast. Please retry in a minute.")
});

// Blanket ceiling for everything else.
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handler("Too many requests. Please slow down.")
});
