export const SHIPPING = {
    standard: { label: "Standard Delivery", eta: "5-7 business days", fee: 0 },
    express: { label: "Express Delivery", eta: "2-3 business days", fee: 1499 }
};

export const FREE_SHIPPING_OVER = 0; // standard is already free

export const rupees = (value) => Math.max(0, Math.round(Number(value) || 0));

// Single source of truth for order arithmetic. The client sends intent
// (items, coupon, shipping method); every rupee is recomputed here.
export const priceOrder = ({ subtotal, shippingMethod = "standard", discount = 0 }) => {
    const shippingFee = SHIPPING[shippingMethod]?.fee ?? 0;
    const safeDiscount = Math.min(rupees(discount), rupees(subtotal));
    return {
        subtotal: rupees(subtotal),
        shippingFee: rupees(shippingFee),
        discount: safeDiscount,
        total: rupees(subtotal) + rupees(shippingFee) - safeDiscount
    };
};
