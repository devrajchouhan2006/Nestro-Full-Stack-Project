import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: ""
    },
    // "admin" unlocks every write route behind requireAdmin. Promote the first
    // admin with `npm run seed:admin` — there is deliberately no way to sign up
    // as one from the public API.
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date,
        attempts: {
            type: Number,
            default: 0
        }
    },
    reset: {
        code: String,
        expiresAt: Date,
        attempts: {
            type: Number,
            default: 0
        }
    },
    // Server-side copies so a signed-in shopper keeps their basket across devices.
    cart: [
        {
            _id: false,
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            variantKey: { type: String, default: "" },
            quantity: { type: Number, default: 1, min: 1 }
        }
    ],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
}, { timestamps: true });

UserSchema.index({ role: 1 });

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
