import mongoose from "mongoose";

// A buyable combination (e.g. Walnut / Large). Products with no variants sell
// off the top-level price and stockQty; products with variants sell off these.
const variantSchema = new mongoose.Schema({
    _id: false,
    key: { type: String, required: true },      // stable id, e.g. "walnut-large"
    label: { type: String, required: true },    // shown to the shopper
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    salePrice: { type: Number, required: true },
    originalPrice: { type: Number },
    stockQty: { type: Number, default: 0, min: 0 },
    image: { type: String, default: null }
});

const productSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        default: ""
    },
    originalPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    shortDescription: { type: String },
    description: { type: String },
    material: { type: String },
    dimensions: {
        width: Number,
        height: Number,
        depth: Number
    },
    weight: { type: Number },
    color: { type: String },
    variants: [variantSchema],

    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },

    thumbnail: { type: String },
    images: [{ type: String }],

    // Real inventory. `stock` stays as a derived boolean so existing filters,
    // admin toggles and the storefront badge keep working unchanged.
    stockQty: { type: Number, default: 0, min: 0 },
    stock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 3 },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    status: { type: Boolean, default: true }
}, { timestamps: true });

// Total sellable units, whichever pricing model the product uses.
productSchema.methods.availableQty = function (variantKey) {
    if (this.variants?.length) {
        const variant = this.variants.find((item) => item.key === variantKey);
        return variant ? variant.stockQty : 0;
    }
    return this.stockQty;
};

// Keep the boolean in step with the count on every save.
productSchema.pre("save", async function () {
    const total = this.variants?.length
        ? this.variants.reduce((sum, v) => sum + (v.stockQty || 0), 0)
        : this.stockQty;
    this.stock = total > 0;
});

productSchema.index({ name: "text", shortDescription: "text", description: "text", material: "text" });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ roomId: 1, status: 1 });
productSchema.index({ salePrice: 1 });

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;
