import OrderModel from "../models/order.model.js";

// NST-YYMMDD-XXXX. Human-readable for support, and collision-checked.
export const generateOrderNumber = async () => {
    const now = new Date();
    const stamp = [
        String(now.getFullYear()).slice(2),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("");

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const rand = String(Math.floor(1000 + Math.random() * 9000));
        const candidate = `NST-${stamp}-${rand}`;
        const clash = await OrderModel.findOne({ orderNumber: candidate }).select("_id").lean();
        if (!clash) return candidate;
    }
    return `NST-${stamp}-${Date.now().toString().slice(-6)}`;
};
