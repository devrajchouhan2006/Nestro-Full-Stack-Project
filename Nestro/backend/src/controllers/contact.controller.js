import nodemailer from "nodemailer";
import EnquiryModel from "../models/enquiry.model.js";
import {
    sendBadRequest, sendNotFound, sendServerError, sendSuccess
} from "../utils/response.js";

// Forwarding to the shop mailbox is a convenience, not the record of truth —
// the database row written first is. Returns whether the mail actually left.
const forward = async (subject, text) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[contact] ${subject}\n${text}`);
        return false;
    }
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            from: `Nestro Website <${process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_INBOX || process.env.EMAIL_USER,
            subject,
            text
        });
        return true;
    } catch (error) {
        console.warn("[contact] could not forward:", error?.message || error);
        return false;
    }
};

const enquiry = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Saved before anything else, so a mail failure can never lose it.
        const row = await EnquiryModel.create({
            kind: "enquiry", name, email, subject: subject || "General", message
        });

        const emailed = await forward(
            `Website enquiry: ${subject || "General"}`,
            `From: ${name} <${email}>\n\n${message}`
        );
        if (emailed) await EnquiryModel.updateOne({ _id: row._id }, { $set: { emailed: true } });

        return sendSuccess(res, "Thanks — we will reply within one business day");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        try {
            await EnquiryModel.create({ kind: "newsletter", email });
        } catch (error) {
            // Already subscribed — a friendly yes, not an error to explain.
            if (error?.code === 11000) return sendSuccess(res, "You are already on the list");
            throw error;
        }

        await forward("Newsletter signup", `New subscriber: ${email}`);
        return sendSuccess(res, "You are on the list");
    } catch (error) {
        return sendServerError(res, error);
    }
};

/* ------------------------------------------------------------------ */
/* admin                                                               */
/* ------------------------------------------------------------------ */

const adminList = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        const filter = {};
        if (req.query.kind) filter.kind = req.query.kind;
        if (req.query.status) filter.status = req.query.status;

        const [items, total, unread] = await Promise.all([
            EnquiryModel.find(filter).sort({ createdAt: -1 })
                .skip((page - 1) * limit).limit(limit).lean(),
            EnquiryModel.countDocuments(filter),
            EnquiryModel.countDocuments({ kind: "enquiry", status: "new" })
        ]);

        return sendSuccess(res, "Enquiries", {
            items, total, page, unread,
            pages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const adminUpdate = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["new", "read", "replied", "archived"].includes(status)) {
            return sendBadRequest(res, "That is not a valid status");
        }
        const row = await EnquiryModel.findByIdAndUpdate(
            req.params.id, { $set: { status } }, { new: true }
        );
        if (!row) return sendNotFound(res, "Enquiry not found");
        return sendSuccess(res, `Marked ${status}`, { enquiry: row });
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { enquiry, subscribe, adminList, adminUpdate };
