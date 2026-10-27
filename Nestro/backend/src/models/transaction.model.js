import mongoose from "mongoose";

// A money ledger that sits beside the orders rather than inside them.
//
// An order already records "is this paid?", but that single flag cannot answer
// the questions a shop actually has to answer at the end of a month: what came
// in, what went back out, which gateway reference belongs to which rupee. One
// order can produce several rows here — a COD charge that later settles, a
// payment followed by a refund — and each row is immutable once written.
const transactionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true
    },
    // Copied, not joined: a ledger row must stay readable even if the order
    // document is ever archived away.
    orderNumber: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // "payment" is money in, "refund" is money back out. Refunds are stored as
    // a positive amount with this flag rather than as a negative payment, so a
    // sum over the column is never accidentally netted.
    kind: {
        type: String,
        enum: ["payment", "refund"],
        default: "payment",
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    method: {
        type: String,
        enum: ["cod", "razorpay"],
        required: true
    },
    // pending: COD accepted but the cash has not been collected yet.
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
        required: true
    },

    provider: { type: String, default: "" },            // "razorpay", "" for cash
    providerOrderId: { type: String, default: "" },
    // null rather than "" when there is no gateway reference: the unique index
    // below keys on "is a string", and every cash row sharing an empty string
    // would collide with every other one.
    providerPaymentId: { type: String, default: null },
    providerRefundId: { type: String, default: null },

    note: { type: String, default: "" },
    // Anything the gateway sent that is worth keeping but not worth a column.
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    settledAt: { type: Date, default: null }
}, { timestamps: true });

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ kind: 1, status: 1, createdAt: -1 });
// One gateway payment id can only ever be recorded once. Partial rather than
// sparse so the rows without a reference (cash, refunds) are excluded outright
// — partialFilterExpression accepts $type but not $ne, which is why the absent
// case is null and not an empty string.
transactionSchema.index(
    { providerPaymentId: 1 },
    { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } } }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;
