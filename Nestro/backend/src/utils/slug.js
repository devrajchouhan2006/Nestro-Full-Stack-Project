// Mirrors the frontend helper so an admin-typed slug and a generated one agree.
export const slugify = (value = "") =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

// Appends -2, -3 ... until the slug is free. `excludeId` lets an edit keep its
// own slug instead of colliding with itself.
export const uniqueSlug = async (Model, value, excludeId = null) => {
    const base = slugify(value) || "item";
    let candidate = base;
    let n = 1;
    for (;;) {
        const query = { slug: candidate };
        if (excludeId) query._id = { $ne: excludeId };
        const clash = await Model.findOne(query).select("_id").lean();
        if (!clash) return candidate;
        n += 1;
        candidate = `${base}-${n}`;
    }
};
