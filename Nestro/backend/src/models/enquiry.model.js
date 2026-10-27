import mongoose from "mongoose";

// Contact-form messages and newsletter signups, kept in the database rather
// than only forwarded by email.
//
// Email alone makes the shop's inbox the only copy: if SMTP is not configured,
// or a message is deleted, or someone else was on the account that day, the
// enquiry is simply gone and the customer is still waiting for the reply the
// form promised them. A row here means nothing is lost and the admin panel can
// show what still needs answering.
const enquirySchema = new mongoose.Schema({
    kind: {
        type: String,
        enum: ["enquiry", "newsletter"],
        default: "enquiry",
        required: true,
        index: true
    },
    name: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, default: "", trim: true },

    status: {
        type: String,
        enum: ["new", "read", "replied", "archived"],
        default: "new",
        index: true
    },
    // Whether the copy actually reached the shop mailbox. False means this row
    // is the only record of it.
    emailed: { type: Boolean, default: false }
}, { timestamps: true });

enquirySchema.index({ createdAt: -1 });
// One address subscribes to the newsletter once.
enquirySchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { kind: "newsletter" } }
);

const EnquiryModel = mongoose.model("Enquiry", enquirySchema);
export default EnquiryModel;
