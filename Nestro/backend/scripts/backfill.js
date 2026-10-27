/**
 * One-off migration for databases created before this build.
 *
 *   npm run migrate
 *
 * - gives every product a stockQty consistent with its old boolean `stock`
 * - fills in missing slugs
 * - sets role "user" on accounts created before roles existed
 * Safe to run more than once.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/config/connectDb.js";
import ProductModel from "../src/models/product.model.js";
import UserModel from "../src/models/user.model.js";
import { uniqueSlug } from "../src/utils/slug.js";

const DEFAULT_STOCK = Number(process.env.MIGRATE_DEFAULT_STOCK || 10);

const run = async () => {
    await connectDB();

    const products = await ProductModel.find({});
    let stockFixed = 0;
    let slugFixed = 0;

    for (const product of products) {
        let dirty = false;

        if (product.stockQty === undefined || product.stockQty === null || product.stockQty === 0) {
            if (product.stock) {
                product.stockQty = DEFAULT_STOCK;
                stockFixed += 1;
                dirty = true;
            }
        }
        if (!product.slug) {
            product.slug = await uniqueSlug(ProductModel, product.name, product._id);
            slugFixed += 1;
            dirty = true;
        }
        if (dirty) await product.save();
    }

    const roles = await UserModel.updateMany(
        { role: { $exists: false } },
        { $set: { role: "user" } }
    );

    console.log(`Products: ${stockFixed} given stock, ${slugFixed} given a slug.`);
    console.log(`Users: ${roles.modifiedCount} given a role.`);

    await mongoose.connection.close();
    process.exit(0);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
