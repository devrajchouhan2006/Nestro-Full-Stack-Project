import { sendBadRequest } from "../utils/response.js";

// Runs a zod schema against one part of the request and replaces it with the
// parsed value, so controllers work with coerced, trimmed, known-shape data.
const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const first = result.error.issues?.[0];
        const field = first?.path?.join(".");
        const message = field ? `${field}: ${first.message}` : (first?.message || "Invalid request");
        return sendBadRequest(res, message);
    }
    if (source === "body") req.body = result.data;
    else req.validated = result.data;
    next();
};

export default validate;
