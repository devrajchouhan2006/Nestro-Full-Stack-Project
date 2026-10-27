import test from "node:test";
import assert from "node:assert/strict";
import { priceOrder, rupees, SHIPPING } from "../src/utils/money.js";

test("standard delivery is free and totals add up", () => {
    const result = priceOrder({ subtotal: 145000, shippingMethod: "standard", discount: 0 });
    assert.equal(result.shippingFee, 0);
    assert.equal(result.total, 145000);
});

test("express delivery adds its fee", () => {
    const result = priceOrder({ subtotal: 10000, shippingMethod: "express" });
    assert.equal(result.shippingFee, SHIPPING.express.fee);
    assert.equal(result.total, 10000 + SHIPPING.express.fee);
});

test("a discount can never exceed the subtotal", () => {
    const result = priceOrder({ subtotal: 1000, discount: 5000 });
    assert.equal(result.discount, 1000);
    assert.equal(result.total, 0);
});

test("negative and junk values floor at zero", () => {
    assert.equal(rupees(-50), 0);
    assert.equal(rupees("abc"), 0);
    assert.equal(rupees("2500.6"), 2501);
});
