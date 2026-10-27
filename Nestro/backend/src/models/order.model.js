import mongoose from "mongoose";

export const ORDER_STATUSES = [
    "pending",           // created, payment not settled
    "confirmed",         // paid, or COD accepted
    "packed",
    "dispatched",        // handed to the courier
    "shipped",           // moving between hubs
    "out_for_delivery",  // with the rider, arriving today
    "delivered",
    "cancelled",
    "return_requested",  // customer asked to send it back
    "returned",          // goods received back, money owed
    "refunded"
];

// The happy path, in order. Anything outside this list is an exit, not a step,
// so the progress rail and the "can this move forward" checks both read it.
export const STATUS_FLOW = [
    "confirmed", "packed", "dispatched", "shipped", "out_for_delivery", "delivered"
];

// How long after delivery a customer may still ask to return an order.
export const RETURN_WINDOW_DAYS = 7;

// Line items copy name/price/image at purchase time. A later price edit or a
// deleted product must never change what a customer was charged.
const orderItemSchema = new mongoose.Schema({
    _id: false,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantKey: { type: String, default: "" },
    variantLabel: { type: String, default: "" },
    name: { type: String, required: true },
    slug: { type: String, default: "" },
    image: { type: String, default: null },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true }
});

const shippingAddressSchema = new mongoose.Schema({
    _id: false,
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" }
});

const OrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    email: { type: String, required: true },
    items: {
        type: [orderItemSchema],
        validate: [(value) => value.length > 0, "An order needs at least one item"]
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true },

    shippingMethod: {
        type: String,
        enum: ["standard", "express"],
        default: "standard"
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "razorpay"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    payment: {
        razorpayOrderId: { type: String, default: "" },
        razorpayPaymentId: { type: String, default: "" },
        razorpaySignature: { type: String, default: "" },
        paidAt: { type: Date, default: null }
    },

    status: {
        type: String,
        enum: ORDER_STATUSES,
        default: "pending"
    },
    timeline: [
        {
            _id: false,
            status: { type: String, enum: ORDER_STATUSES },
            note: { type: String, default: "" },
            at: { type: Date, default: Date.now }
        }
    ],
    cancelReason: { type: String, default: "" },

    // Return handling. deliveredAt is what the return window is measured from,
    // so it is stamped the moment an order is marked delivered.
    deliveredAt: { type: Date, default: null },
    returnReason: { type: String, default: "" },
    returnRequestedAt: { type: Date, default: null },

    // The client's own id for one checkout attempt. Two requests carrying the
    // same key from the same user are the same order, however many times the
    // button was pressed or the network retried.
    idempotencyKey: { type: String, default: null },

    // Set once stock has been decremented, so a retried payment webhook can
    // never take the same units twice.
    stockCommitted: { type: Boolean, default: false }
}, { timestamps: true });

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
// Partial, so the many older orders with no key don't collide on null.
OrderSchema.index(
    { userId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;
