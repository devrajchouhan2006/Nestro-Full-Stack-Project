import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// Where undeliverable mail lands in development. Without this an unconfigured
// mailbox means order confirmations simply vanish — the templates can never be
// checked, and "I placed an order but got no email" has no trail to follow.
const OUTBOX = path.resolve(process.cwd(), ".mail-outbox");

const writeToOutbox = async (to, subject, html) => {
    try {
        await fs.mkdir(OUTBOX, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
        const file = path.join(OUTBOX, `${stamp}__${slug}.html`);
        await fs.writeFile(
            file,
            `<!-- To: ${to}\n     Subject: ${subject}\n     Written because EMAIL_USER / EMAIL_PASS are not set. -->\n${html}`
        );
        console.log(`[mail] not sent (no credentials) — saved to ${path.relative(process.cwd(), file)}`);
        return file;
    } catch (error) {
        console.warn("[mail] could not write to the outbox:", error?.message || error);
        return null;
    }
};

let transporter = null;
const getTransporter = () => {
    if (!isConfigured()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return transporter;
};

const shell = (title, body) => `
<div style="font-family:-apple-system,Segoe UI,sans-serif;background:#F8F5F1;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E8E0D5;border-radius:12px;padding:28px">
    <p style="margin:0 0 20px;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#1E1E1E">
      Nestro<span style="color:#8B5E3C">.</span>
    </p>
    <h2 style="margin:0 0 14px;font-size:19px;font-weight:600;color:#1E1E1E">${title}</h2>
    ${body}
  </div>
  <p style="max-width:560px;margin:14px auto 0;font-size:11px;color:#8a8079;text-align:center">
    You are receiving this because you have a Nestro account.
  </p>
</div>`;

const send = async (to, subject, html) => {
    const mailer = getTransporter();
    if (!mailer) {
        // In production a silent drop would be worse than a loud failure, so
        // the caller still gets to decide. In development the message is saved
        // where it can be opened and checked.
        if (process.env.NODE_ENV === "production") {
            throw new Error("Email is not configured (EMAIL_USER / EMAIL_PASS missing)");
        }
        await writeToOutbox(to, subject, html);
        return;
    }
    await mailer.sendMail({
        from: `Nestro <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};

const codeBlock = (code) => `
  <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:18px 0;color:#8B5E3C">${code}</p>`;

export const sendOtpEmail = (to, otp) => send(
    to,
    "Your Nestro verification code",
    shell("Verify your email", `
        <p style="margin:0;font-size:14px;color:#4A423B">Enter this code to finish setting up your account.</p>
        ${codeBlock(otp)}
        <p style="margin:0;font-size:12px;color:#7A7167">Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you did not ask for this, ignore this email.</p>`)
);

export const sendResetEmail = (to, code) => send(
    to,
    "Reset your Nestro password",
    shell("Reset your password", `
        <p style="margin:0;font-size:14px;color:#4A423B">Use this code to choose a new password.</p>
        ${codeBlock(code)}
        <p style="margin:0;font-size:12px;color:#7A7167">Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you did not ask for this, your password is unchanged.</p>`)
);

export const sendOrderConfirmationEmail = (to, order) => {
    const rows = order.items.map((item) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#1E1E1E">${item.name}${item.variantLabel ? ` <span style="color:#7A7167">(${item.variantLabel})</span>` : ""} &times; ${item.quantity}</td>
          <td style="padding:8px 0;font-size:13px;text-align:right;color:#1E1E1E">&#8377;${item.lineTotal.toLocaleString("en-IN")}</td>
        </tr>`).join("");

    return send(
        to,
        `Order ${order.orderNumber} confirmed`,
        shell("Thanks for your order", `
        <p style="margin:0 0 16px;font-size:14px;color:#4A423B">Order <strong>${order.orderNumber}</strong> is confirmed. We will email you again when it ships.</p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E0D5;border-bottom:1px solid #E8E0D5;margin-bottom:14px">${rows}</table>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="font-size:13px;color:#7A7167;padding:3px 0">Subtotal</td><td style="font-size:13px;text-align:right;padding:3px 0">&#8377;${order.subtotal.toLocaleString("en-IN")}</td></tr>
          <tr><td style="font-size:13px;color:#7A7167;padding:3px 0">Delivery</td><td style="font-size:13px;text-align:right;padding:3px 0">${order.shippingFee ? "&#8377;" + order.shippingFee.toLocaleString("en-IN") : "Free"}</td></tr>
          ${order.discount ? `<tr><td style="font-size:13px;color:#7A7167;padding:3px 0">Discount${order.couponCode ? " (" + order.couponCode + ")" : ""}</td><td style="font-size:13px;text-align:right;padding:3px 0;color:#2C6B4C">-&#8377;${order.discount.toLocaleString("en-IN")}</td></tr>` : ""}
          <tr><td style="font-size:15px;font-weight:700;padding:10px 0 0">Total</td><td style="font-size:15px;font-weight:700;text-align:right;padding:10px 0 0">&#8377;${order.total.toLocaleString("en-IN")}</td></tr>
        </table>`)
    );
};

// Raw status keys are for the database, not for a customer's inbox.
const STATUS_WORDING = {
    pending: "awaiting payment",
    confirmed: "confirmed",
    packed: "packed and ready",
    dispatched: "dispatched",
    shipped: "on its way",
    out_for_delivery: "out for delivery",
    delivered: "delivered",
    cancelled: "cancelled",
    return_requested: "return requested",
    returned: "returned",
    refunded: "refunded"
};

export const sendOrderStatusEmail = (to, order) => {
    const wording = STATUS_WORDING[order.status] || String(order.status).replace(/_/g, " ");
    return send(
        to,
        `Order ${order.orderNumber} is ${wording}`,
        shell(`Your order is ${wording}`, `
        <p style="margin:0;font-size:14px;color:#4A423B">Order <strong>${order.orderNumber}</strong> is now <strong>${wording}</strong>.</p>`)
    );
};

export { isConfigured as isEmailConfigured };
