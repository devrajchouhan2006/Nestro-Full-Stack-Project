import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/connectDb.js";
import { globalLimiter } from "./src/middleware/rateLimit.js";
import { sendNotFound, sendServerError } from "./src/utils/response.js";

import authRouter from "./src/routers/auth.router.js";
import categoryRouter from "./src/routers/category.router.js";
import productRouter from "./src/routers/product.router.js";
import roomRouter from "./src/routers/room.router.js";
import orderRouter from "./src/routers/order.router.js";
import { razorpayWebhook } from "./src/controllers/order.controller.js";
import addressRouter from "./src/routers/address.router.js";
import userRouter from "./src/routers/user.router.js";
import couponRouter from "./src/routers/coupon.router.js";
import reviewRouter from "./src/routers/review.router.js";
import dashboardRouter from "./src/routers/dashboard.router.js";
import contactRouter from "./src/routers/contact.router.js";

const server = express();
const PORT = process.env.PORT || 5000;

// Behind a proxy (Render, Railway, nginx) the rate limiter and secure cookies
// need the real client IP and protocol.
server.set("trust proxy", 1);

server.use(helmet({
    // The API serves JSON and Cloudinary-hosted images; a strict CORP header
    // would block the storefront from loading those.
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Razorpay signs the exact bytes it sent, so this one route must see the raw
// body — it is mounted ahead of express.json() for that reason alone.
server.post(
    "/api/order/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    razorpayWebhook
);

server.use(express.json({ limit: "1mb" }));
server.use(express.urlencoded({ extended: true, limit: "1mb" }));
server.use(cookieParser());

// Origins come from the environment so a deploy never needs a code change.
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

server.use(cors({
    origin(origin, callback) {
        // Same-origin, curl and server-to-server calls arrive without an Origin.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
}));

server.use(globalLimiter);

server.get("/", (req, res) => {
    res.status(200).json({
        message: "Server is healthy",
        success: true,
        env: process.env.NODE_ENV || "development"
    });
});

server.use("/api/auth", authRouter);
server.use("/api/user", userRouter);
server.use("/api/category", categoryRouter);
server.use("/api/product", productRouter);
server.use("/api/room", roomRouter);
server.use("/api/order", orderRouter);
server.use("/api/address", addressRouter);
server.use("/api/coupon", couponRouter);
server.use("/api/review", reviewRouter);
server.use("/api/admin", dashboardRouter);
server.use("/api/contact", contactRouter);

// Unknown route: answer in the same JSON shape the frontend already parses.
server.use((req, res) => sendNotFound(res, `No route for ${req.method} ${req.originalUrl}`));

// Catch-all error handler: middleware-level failures (multer/Cloudinary upload
// rejections, CORS refusals) happen before a route's own try/catch, so without
// this Express falls back to a plain-text 500 the frontend can't parse.
server.use((err, req, res, next) => {
    if (err?.message?.includes("not allowed by CORS")) {
        return res.status(403).json({ success: false, message: "Origin not allowed" });
    }
    if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "That file is too large" });
    }
    return sendServerError(res, err);
});

const start = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

start();

// A crash should be loud in the log rather than silently leaving a half-dead
// process serving requests.
process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
});

export default server;
