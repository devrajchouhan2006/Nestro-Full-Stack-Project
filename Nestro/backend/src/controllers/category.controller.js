import CategoryModel from "../models/category.model.js";
import ProductModel from "../models/product.model.js";
import { uniqueSlug } from "../utils/slug.js";
import {
    sendBadRequest, sendConflict, sendCreated, sendNotFound,
    sendServerError, sendSuccess
} from "../utils/response.js";

const create = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        const existing = await CategoryModel.findOne({ name }).select("_id").lean();
        if (existing) return sendConflict(res, "That category already exists");

        const category = await CategoryModel.create({
            name,
            slug: await uniqueSlug(CategoryModel, slug || name),
            image: req.file ? req.file.path : null,
            ...(status !== undefined ? { status } : {})
        });

        return sendCreated(res, "Category created", { category });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

const read = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status !== undefined) filter.status = req.query.status === "true";

        const categories = await CategoryModel.find(filter).sort({ name: 1 }).lean();
        return res.status(200).json({
            message: "Category data find",
            success: true,
            categories
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const readById = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id).lean();
        if (!category) return sendNotFound(res, "Category not found");
        return res.status(200).json({
            message: "Category data find",
            success: true,
            category
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const edit = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        const category = await CategoryModel.findById(req.params.id);
        if (!category) return sendNotFound(res, "Category not found");

        if (name && name !== category.name) {
            const clash = await CategoryModel.findOne({ name, _id: { $ne: category._id } }).select("_id").lean();
            if (clash) return sendConflict(res, "That category already exists");
            category.name = name;
            category.slug = await uniqueSlug(CategoryModel, slug || name, category._id);
        } else if (slug) {
            category.slug = await uniqueSlug(CategoryModel, slug, category._id);
        }

        if (status !== undefined) category.status = status;
        if (req.file) category.image = req.file.path;

        await category.save();
        return sendSuccess(res, "Category updated", { category });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

const updateById = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) return sendNotFound(res, "Category not found");
        category.status = !category.status;
        await category.save();
        return sendSuccess(res, "Status update successfully");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);
        if (!category) return sendNotFound(res, "Category not found");

        // Refuse rather than orphan products pointing at a missing category.
        const inUse = await ProductModel.countDocuments({ categoryId: id });
        if (inUse) {
            return sendBadRequest(res, `${inUse} product${inUse > 1 ? "s" : ""} still use this category. Move them first.`);
        }

        await CategoryModel.findByIdAndDelete(id);
        return sendSuccess(res, "Category deleted");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { create, read, readById, edit, updateById, deleteById };
