import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { sendUnauthorized, sendForbidden } from "../utils/response.js";

const readToken = (req) => req.cookies?.token || null;

// Attaches req.userId when a valid cookie is present. Rejects otherwise.
const verifyToken = (req, res, next) => {
    try {
        const token = readToken(req);
        if (!token) return sendUnauthorized(res, "Please sign in to continue");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role || "user";
        next();
    } catch (error) {
        return sendUnauthorized(res, "Session expired, please sign in again");
    }
};

// Same, but never blocks: used by routes that behave differently for guests.
const optionalAuth = (req, res, next) => {
    try {
        const token = readToken(req);
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            req.userRole = decoded.role || "user";
        }
    } catch {
        // An expired cookie just means "guest" here.
    }
    next();
};

// Re-reads the role from the database rather than trusting the token, so
// revoking an admin takes effect immediately instead of at token expiry.
const requireAdmin = async (req, res, next) => {
    try {
        const token = readToken(req);
        if (!token) return sendUnauthorized(res, "Please sign in to continue");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select("role isVerified");
        if (!user) return sendUnauthorized(res, "Session expired, please sign in again");
        if (user.role !== "admin") return sendForbidden(res, "Admin access required");

        req.userId = user._id;
        req.userRole = user.role;
        next();
    } catch (error) {
        return sendUnauthorized(res, "Session expired, please sign in again");
    }
};

export default verifyToken;
export { verifyToken, optionalAuth, requireAdmin };
