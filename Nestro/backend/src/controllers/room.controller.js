import RoomModel from "../models/room.model.js";
import ProductModel from "../models/product.model.js";
import { uniqueSlug } from "../utils/slug.js";
import {
    sendBadRequest, sendConflict, sendCreated, sendNotFound,
    sendServerError, sendSuccess
} from "../utils/response.js";

const create = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        const existing = await RoomModel.findOne({ name }).select("_id").lean();
        if (existing) return sendConflict(res, "That room type already exists");

        const room = await RoomModel.create({
            name,
            slug: await uniqueSlug(RoomModel, slug || name),
            image: req.file ? req.file.path : null,
            ...(status !== undefined ? { status } : {})
        });

        return sendCreated(res, "Room type created", { room });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

const read = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status !== undefined) filter.status = req.query.status === "true";

        const rooms = await RoomModel.find(filter).sort({ name: 1 }).lean();
        return res.status(200).json({
            message: "Room data find",
            success: true,
            rooms
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const readById = async (req, res) => {
    try {
        const room = await RoomModel.findById(req.params.id).lean();
        if (!room) return sendNotFound(res, "Room type not found");
        return res.status(200).json({
            message: "Room data find",
            success: true,
            room
        });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const edit = async (req, res) => {
    try {
        const { name, slug, status } = req.body;

        const room = await RoomModel.findById(req.params.id);
        if (!room) return sendNotFound(res, "Room type not found");

        if (name && name !== room.name) {
            const clash = await RoomModel.findOne({ name, _id: { $ne: room._id } }).select("_id").lean();
            if (clash) return sendConflict(res, "That room type already exists");
            room.name = name;
            room.slug = await uniqueSlug(RoomModel, slug || name, room._id);
        } else if (slug) {
            room.slug = await uniqueSlug(RoomModel, slug, room._id);
        }

        if (status !== undefined) room.status = status;
        if (req.file) room.image = req.file.path;

        await room.save();
        return sendSuccess(res, "Room type updated", { room });
    } catch (error) {
        if (error.name === "ValidationError") return sendBadRequest(res, error.message);
        return sendServerError(res, error);
    }
};

const updateById = async (req, res) => {
    try {
        const room = await RoomModel.findById(req.params.id);
        if (!room) return sendNotFound(res, "Room type not found");
        room.status = !room.status;
        await room.save();
        return sendSuccess(res, "Status update successfully");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await RoomModel.findById(id);
        if (!room) return sendNotFound(res, "Room type not found");

        const inUse = await ProductModel.countDocuments({ roomId: id });
        if (inUse) {
            return sendBadRequest(res, `${inUse} product${inUse > 1 ? "s" : ""} still use this room type. Move them first.`);
        }

        await RoomModel.findByIdAndDelete(id);
        return sendSuccess(res, "Room type deleted");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { create, read, readById, edit, updateById, deleteById };
