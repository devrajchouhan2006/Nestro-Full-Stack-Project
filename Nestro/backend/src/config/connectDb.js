import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connect");
        await ensureIndexes();
    } catch (error) {
        console.error("MongoDB connection Failed:", error.message);
        process.exit(1);
    }
}

// Mongoose builds indexes in the background, so on a fresh database the server
// can start answering before they exist — and a unique index that is not there
// yet enforces nothing. Two clicks racing past a half-built index is exactly
// how one checkout becomes two orders, so the build is awaited here, before
// app.js starts listening.
async function ensureIndexes() {
    const models = Object.values(mongoose.models);
    if (!models.length) return;

    const results = await Promise.allSettled(models.map((model) => model.createIndexes()));
    const failed = results
        .map((result, index) => (result.status === "rejected" ? models[index].modelName : null))
        .filter(Boolean);

    if (failed.length) {
        // Worth shouting about — a missing unique index is a silent data bug,
        // not a missing feature — but not worth refusing to start over.
        console.warn(`[db] indexes could not be built for: ${failed.join(", ")}`);
    } else {
        console.log(`Indexes ready (${models.length} models)`);
    }
}

export default connectDB;
export { ensureIndexes };
