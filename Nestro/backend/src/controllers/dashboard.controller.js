import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import { sendServerError, sendSuccess } from "../utils/response.js";

// The shop's own clock. Mongo buckets dates in UTC unless told otherwise, so
// without this an evening order in India lands on the next day's bar — and
// today's sales never show up on the chart at all.
const REPORT_TZ = process.env.REPORT_TIMEZONE || "Asia/Kolkata";

const daysAgo = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
};

// A YYYY-MM-DD key in REPORT_TZ, matching what $dateToString produces below.
// toISOString() cannot be used here: it would convert back to UTC and reopen
// the very mismatch this exists to close.
const dayKey = (date) => new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TZ, year: "numeric", month: "2-digit", day: "2-digit"
}).format(date);

// Revenue counts only orders that were actually paid for; cancelled and
// refunded orders are excluded everywhere.
const PAID = { paymentStatus: "paid", status: { $nin: ["cancelled", "refunded"] } };

const overview = async (req, res) => {
    try {
        const since = daysAgo(29);

        const [
            revenueAgg, prevRevenueAgg, orderCount, customerCount,
            pendingCount, lowStock, recentOrders, series, topProducts
        ] = await Promise.all([
            OrderModel.aggregate([
                { $match: { ...PAID, createdAt: { $gte: since } } },
                { $group: { _id: null, total: { $sum: "$total" }, orders: { $sum: 1 } } }
            ]),
            OrderModel.aggregate([
                { $match: { ...PAID, createdAt: { $gte: daysAgo(59), $lt: since } } },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]),
            OrderModel.countDocuments({ status: { $ne: "cancelled" } }),
            UserModel.countDocuments({ role: "user", isVerified: true }),
            OrderModel.countDocuments({ status: { $in: ["pending", "confirmed", "packed"] } }),
            ProductModel.find({ status: true, $expr: { $lte: ["$stockQty", "$lowStockThreshold"] } })
                .select("_id name stockQty thumbnail")
                .sort({ stockQty: 1 })
                .limit(6)
                .lean(),
            OrderModel.find()
                .sort({ createdAt: -1 })
                .limit(6)
                .select("orderNumber email total status paymentStatus createdAt")
                .lean(),
            OrderModel.aggregate([
                { $match: { ...PAID, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d", date: "$createdAt", timezone: REPORT_TZ
                            }
                        },
                        revenue: { $sum: "$total" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            OrderModel.aggregate([
                { $match: { ...PAID } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        name: { $first: "$items.name" },
                        image: { $first: "$items.image" },
                        units: { $sum: "$items.quantity" },
                        revenue: { $sum: "$items.lineTotal" }
                    }
                },
                { $sort: { units: -1 } },
                { $limit: 5 }
            ])
        ]);

        const revenue = revenueAgg[0]?.total || 0;
        const previous = prevRevenueAgg[0]?.total || 0;
        const change = previous ? Math.round(((revenue - previous) / previous) * 100) : null;

        // Fill the gaps so the sparkline has one point per day, not per sale.
        const byDay = new Map(series.map((row) => [row._id, row]));
        const filled = [];
        for (let i = 29; i >= 0; i -= 1) {
            const key = dayKey(daysAgo(i));
            const row = byDay.get(key);
            filled.push({ date: key, revenue: row?.revenue || 0, orders: row?.orders || 0 });
        }

        return sendSuccess(res, "Dashboard", {
            stats: {
                revenue30d: revenue,
                revenueChangePct: change,
                orders30d: revenueAgg[0]?.orders || 0,
                totalOrders: orderCount,
                customers: customerCount,
                openOrders: pendingCount
            },
            series: filled,
            topProducts,
            lowStock,
            recentOrders,
            // Which integrations are actually wired up. Nothing secret is sent —
            // only whether a value exists — so a half-configured deployment is
            // visible on the dashboard instead of being discovered by a
            // customer who never got their confirmation email.
            config: {
                email: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
                razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
                razorpayLive: String(process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_live"),
                razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
                cloudinary: Boolean(process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET)
            }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const customers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const filter = { role: "user" };
        if (req.query.q) {
            const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const rx = new RegExp(safe, "i");
            filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
        }

        const [users, total] = await Promise.all([
            UserModel.find(filter)
                .select("firstName lastName email phone isVerified createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            UserModel.countDocuments(filter)
        ]);

        return sendSuccess(res, "Customers", {
            customers: users,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { overview, customers };
