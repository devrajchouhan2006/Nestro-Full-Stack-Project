import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../src/utils/slug.js";

test("slugify lowercases, trims and hyphenates", () => {
    assert.equal(slugify("  Oak Dining Table  "), "oak-dining-table");
});

test("slugify strips punctuation and collapses separators", () => {
    assert.equal(slugify("Sofa -- 3 Seater!! (Walnut)"), "sofa-3-seater-walnut");
});

test("slugify survives an empty string", () => {
    assert.equal(slugify(""), "");
});
