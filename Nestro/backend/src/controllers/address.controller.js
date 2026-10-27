import AddressModel from "../models/address.model.js";
import { sendCreated, sendNotFound, sendServerError, sendSuccess } from "../utils/response.js";

// Exactly one default per user: setting a new one clears the rest.
const clearOtherDefaults = (userId, keepId = null) =>
    AddressModel.updateMany(
        { userId, ...(keepId ? { _id: { $ne: keepId } } : {}) },
        { $set: { isDefault: false } }
    );

const list = async (req, res) => {
    try {
        const addresses = await AddressModel.find({ userId: req.userId })
            .sort({ isDefault: -1, updatedAt: -1 })
            .lean();
        return sendSuccess(res, "Addresses", { addresses });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const create = async (req, res) => {
    try {
        const count = await AddressModel.countDocuments({ userId: req.userId });
        const isDefault = req.body.isDefault || count === 0;

        const address = await AddressModel.create({ ...req.body, userId: req.userId, isDefault });
        if (isDefault) await clearOtherDefaults(req.userId, address._id);

        return sendCreated(res, "Address saved", { address });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const update = async (req, res) => {
    try {
        const address = await AddressModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!address) return sendNotFound(res, "Address not found");
        if (address.isDefault) await clearOtherDefaults(req.userId, address._id);

        return sendSuccess(res, "Address updated", { address });
    } catch (error) {
        return sendServerError(res, error);
    }
};

const setDefault = async (req, res) => {
    try {
        const address = await AddressModel.findOne({ _id: req.params.id, userId: req.userId });
        if (!address) return sendNotFound(res, "Address not found");

        address.isDefault = true;
        await address.save();
        await clearOtherDefaults(req.userId, address._id);

        return sendSuccess(res, "Default address updated");
    } catch (error) {
        return sendServerError(res, error);
    }
};

const remove = async (req, res) => {
    try {
        const address = await AddressModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!address) return sendNotFound(res, "Address not found");

        // Promote another address so the account is never left without a default.
        if (address.isDefault) {
            const next = await AddressModel.findOne({ userId: req.userId }).sort({ updatedAt: -1 });
            if (next) {
                next.isDefault = true;
                await next.save();
            }
        }
        return sendSuccess(res, "Address removed");
    } catch (error) {
        return sendServerError(res, error);
    }
};

export { list, create, update, setDefault, remove };
