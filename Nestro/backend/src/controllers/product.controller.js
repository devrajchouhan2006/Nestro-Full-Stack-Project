import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import ReviewModel from "../models/review.model.js";
import { uniqueSlug } from "../utils/slug.js";
import {
    sendBadRequest, sendConflict, sendCreated, sendNotFound,
    sendServerError, sendSuccess
} from "../utils/response.js";

const toList = (value) =>
    value ? String(value).split(",").map((item) => item.trim()).filter(Boolean) : [];

const PRICE_BANDS = {
    "under-10k": { min: 0, max: 10000 },
    "10k-25k": { min: 10000, max: 25000 },
    "25k-50k": { min: 25000, max: 50000 },
    "50k-75k": { min: 50000, max: 75000 },
    "above-75k": { min: 75000, max: null }
};

const sortMap = {
    price_asc: { salePrice: 1 },
    price_desc: { salePrice: -1 },
    newest: { createdAt: -1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
    featured: { featured: -1, createdAt: -1 }
};

// Multipart sends everything as strings; variants arrive as a JSON blob.
const parseVariants = (raw) => {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
};

const buildDimensions = ({ width, height, depth }) => {
    if (width === undefined && height === undefined && depth === undefined) return undefined;
    return {
        width: width !== undefined ? Number(width) : undefined,
        height: height !== undefined ? Number(height) : undefined,
        depth: depth !== undefined ? Number(depth) : undefined
    };
};

const computeDiscount = (originalPrice, salePrice, provided) => {
    if (provided) return Number(provided);
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

const create = async (req, res) => {
    try {
        const image_url = req.file ? req.file.path : null;
        const { width, height, depth, slug, variants, ...rest } = req.body;

        const clash = await ProductModel.findOne({ name: rest.name }).select("_id").lean();
        if (clash) return sendConflict(res, "A product with this name already exists");

        const dimensions = buildDimensions({ width, height, depth });
        const parsedVariants = parseVariants(variants);

        const product = await ProductModel.create({
            ...rest,
            slug: await uniqueSlug(ProductModel, slug || rest.name),
            discount: computeDiscount(rest.originalPrice, rest.salePrice, rest.discount),
            ...(dimensions ? { dimensions } : {}),
            ...(parsedVariants ? { variants: parsedVariants } : {}),
            thumbnail: image_url
        });

        return sendCreated(res, "Product created", { product });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

// Full edit. Only the keys present in the body change, so a partial admin form
// can never blank out fields it does not render.
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");

        const { width, height, depth, slug, variants, ...rest } = req.body;

        if (rest.name && rest.name !== product.name) {
            const clash = await ProductModel.findOne({ name: rest.name, _id: { $ne: id } }).select("_id").lean();
            if (clash) return sendConflict(res, "A product with this name already exists");
        }

        Object.entries(rest).forEach(([key, value]) => {
            if (value !== undefined) product[key] = value;
        });

        if (slug || (rest.name && rest.name !== product.slug)) {
            product.slug = await uniqueSlug(ProductModel, slug || rest.name || product.name, id);
        }

        const dimensions = buildDimensions({ width, height, depth });
        if (dimensions) product.dimensions = { ...product.dimensions?.toObject?.(), ...dimensions };

        const parsedVariants = parseVariants(variants);
        if (parsedVariants) product.variants = parsedVariants;

        if (rest.originalPrice !== undefined || rest.salePrice !== undefined) {
            product.discount = computeDiscount(product.originalPrice, product.salePrice, rest.discount);
        }

        if (req.file) product.thumbnail = req.file.path;

        await product.save();
        return sendSuccess(res, "Product updated", { product });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

const read = async (req, res) => {
    try {
        const query = req.query;
        const filter = {};

        if (query.status !== undefined) filter.status = query.status === "true";
        if (query.best_seller) filter.bestSeller = query.best_seller === "true";
        if (query.featured) filter.featured = query.featured === "true";
        if (query.newArrival) filter.newArrival = query.newArrival === "true";
        if (query.stock) filter.stock = query.stock === "true";

        const categoryIds = toList(query.category).filter(mongoose.isValidObjectId);
        if (categoryIds.length) filter.categoryId = { $in: categoryIds };

        const roomIds = toList(query.room).filter(mongoose.isValidObjectId);
        if (roomIds.length) filter.roomId = { $in: roomIds };

        const materials = toList(query.material);
        if (materials.length) filter.material = { $in: materials };

        const colors = toList(query.color);
        if (colors.length) filter.color = { $in: colors };

        if (query.inStock === "true") filter.stock = true;

        const search = String(query.q || "").trim();
        if (search) {
            const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const rx = new RegExp(safe, "i");
            filter.$and = [
                ...(filter.$and || []),
                { $or: [{ name: rx }, { shortDescription: rx }, { material: rx }, { sku: rx }] }
            ];
        }

        const priceBands = toList(query.priceBand).filter((id) => PRICE_BANDS[id]);
        if (priceBands.length) {
            const bandClause = {
                $or: priceBands.map((id) => {
                    const { min, max } = PRICE_BANDS[id];
                    return max === null
                        ? { salePrice: { $gte: min } }
                        : { salePrice: { $gte: min, $lte: max } };
                })
            };
            filter.$and = [...(filter.$and || []), bandClause];
        }

        if (query.exclude && mongoose.isValidObjectId(query.exclude)) {
            filter._id = { $ne: query.exclude };
        }

        const hasPagination = Boolean(query.page || query.limit);
        const limit = hasPagination
            ? Math.min(parseInt(query.limit) || 12, 60)
            : (query.limit ? Math.min(parseInt(query.limit), 60) : 0);
        const page = hasPagination ? Math.max(parseInt(query.page) || 1, 1) : 1;
        const skip = hasPagination ? (page - 1) * limit : (query.skip ? parseInt(query.skip) : 0);

        const sort = sortMap[query.sort] || sortMap.featured;

        let productsQuery = ProductModel.find(filter)
            .populate([
                { select: "_id name slug", path: "categoryId" },
                { select: "_id name slug", path: "roomId" }
            ])
            .sort(sort)
            .skip(skip);
        if (limit) productsQuery = productsQuery.limit(limit);

        const [products, total] = await Promise.all([
            productsQuery.lean(),
            ProductModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Product data find",
            success: true,
            products,
            total,
            page,
            pages: limit ? Math.max(Math.ceil(total / limit), 1) : 1
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const facets = async (req, res) => {
    try {
        const [materials, colors, priceRange] = await Promise.all([
            ProductModel.distinct("material", { material: { $nin: [null, ""] } }),
            ProductModel.distinct("color", { color: { $nin: [null, ""] } }),
            ProductModel.aggregate([
                { $group: { _id: null, min: { $min: "$salePrice" }, max: { $max: "$salePrice" } } }
            ])
        ]);

        return res.status(200).json({
            message: "Product facets",
            success: true,
            materials: materials.sort(),
            colors: colors.sort(),
            minPrice: priceRange[0]?.min ?? 0,
            maxPrice: priceRange[0]?.max ?? 0
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Accepts an id or a slug so product URLs can be made pretty later without a
// second endpoint.
const readById = async (req, res) => {
    try {
        const { id } = req.params;
        const where = mongoose.isValidObjectId(id) ? { _id: id } : { slug: String(id).toLowerCase() };

        const product = await ProductModel.findOne(where).populate([
            { select: "_id name slug", path: "categoryId" },
            { select: "_id name slug", path: "roomId" }
        ]).lean();

        if (!product) return sendNotFound(res, "Product not found");

        return res.status(200).json({
            message: "Product data find",
            success: true,
            product
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const statusUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");
        product.status = !product.status;
        await product.save();
        return sendSuccess(res, "Status update successfully");
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Toggles one boolean flag by name, with an allowlist so an arbitrary field
// name from the client cannot be flipped.
const TOGGLEABLE = new Set(["featured", "bestSeller", "newArrival", "status", "stock"]);

const statusById = async (req, res) => {
    try {
        const { id } = req.params;
        const { field } = req.body;
        if (!TOGGLEABLE.has(field)) return sendBadRequest(res, "That field cannot be toggled");

        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");

        product[field] = !product[field];
        if (field === "stock") product.stockQty = product.stock ? Math.max(product.stockQty, 1) : 0;
        await product.save();

        return sendSuccess(res, "Status update successfully");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");

        await Promise.all([
            ProductModel.findByIdAndDelete(id),
            ReviewModel.deleteMany({ productId: id })
        ]);
        return sendSuccess(res, "Product deleted");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const addImages = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");

        if (!req.files || req.files.length === 0) {
            return sendBadRequest(res, "Please upload at least one image");
        }

        const imageUrls = req.files.map((file) => file.path);
        product.images.push(...imageUrls);
        // The first upload doubles as the thumbnail when none is set yet.
        if (!product.thumbnail) product.thumbnail = imageUrls[0];
        await product.save();

        return sendSuccess(res, "Images added", { images: product.images });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const removeImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { url } = req.body;
        if (!url) return sendBadRequest(res, "Image url is required");

        const product = await ProductModel.findById(id);
        if (!product) return sendNotFound(res, "Product not found");

        product.images = product.images.filter((image) => image !== url);
        if (product.thumbnail === url) product.thumbnail = product.images[0] || null;
        await product.save();

        return sendSuccess(res, "Image removed", { images: product.images });
    } catch (error) {
        return sendServerError(res, error);
    }
};

// Lightweight endpoint for the navbar search dropdown.
const suggest = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (q.length < 2) return sendSuccess(res, "Suggestions", { products: [] });

        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(safe, "i");
        const products = await ProductModel.find({
            status: true,
            $or: [{ name: rx }, { material: rx }, { sku: rx }]
        })
            .select("_id name slug thumbnail salePrice")
            .limit(6)
            .lean();

        return sendSuccess(res, "Suggestions", { products });
    } catch (error) {
        return sendServerError(res, error);
    }
};

export {
    create,
    update,
    read,
    facets,
    readById,
    statusUpdate,
    statusById,
    deleteById,
    addImages,
    removeImage,
    suggest
};
