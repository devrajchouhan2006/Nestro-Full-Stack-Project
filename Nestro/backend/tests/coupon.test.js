import test from "node:test";
import assert from "node:assert/strict";
import CouponModel from "../src/models/coupon.model.js";

// discountFor is pure arithmetic on the document, so it can be exercised on a
// hydrated model without touching the database.
const build = (fields) => new CouponModel(fields);

test("percent coupons round to the rupee", () => {
    const coupon = build({ code: "NESTRO15", type: "percent", value: 15 });
    assert.equal(coupon.discountFor(171000), 25650);
});

test("percent coupons respect maxDiscount", () => {
    const coupon = build({ code: "CAP", type: "percent", value: 50, maxDiscount: 2000 });
    assert.equal(coupon.discountFor(100000), 2000);
});

test("flat coupons never exceed the subtotal", () => {
    const coupon = build({ code: "FLAT5K", type: "flat", value: 5000 });
    assert.equal(coupon.discountFor(3000), 3000);
});
