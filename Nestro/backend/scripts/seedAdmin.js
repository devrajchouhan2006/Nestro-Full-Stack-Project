/**
 * Promotes an account to admin, creating it if needed.
 *
 *   npm run seed:admin -- admin@nestro.in "Strong Passw0rd" Rakesh
 *
 * There is deliberately no public route that can grant this role.
 */
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../src/config/connectDb.js";
import UserModel from "../src/models/user.model.js";

const [email, password, firstName = "Admin"] = process.argv.slice(2);

if (!email || !password) {
    console.error('Usage: npm run seed:admin -- <email> "<password>" [firstName]');
    process.exit(1);
}
if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
}

const run = async () => {
    await connectDB();

    const lower = email.toLowerCase();
    const existing = await UserModel.findOne({ email: lower });

    if (existing) {
        existing.role = "admin";
        existing.isVerified = true;
        existing.password = await bcrypt.hash(password, 10);
        await existing.save();
        console.log(`Promoted ${lower} to admin and reset the password.`);
    } else {
        await UserModel.create({
            firstName,
            email: lower,
            password: await bcrypt.hash(password, 10),
            role: "admin",
            isVerified: true
        });
        console.log(`Created admin ${lower}.`);
    }

    await mongoose.connection.close();
    process.exit(0);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
