const sendSuccess = (res, message = "Success", extra = {}) => {
    return res.status(200).json({
        success: true,
        message,
        ...extra
    });
};

const sendCreated = (res, message = "Created successfully", extra = {}) => {
    return res.status(201).json({
        success: true,
        message,
        ...extra
    });
};

const sendBadRequest = (res, message = "Bad request") => {
    return res.status(400).json({
        success: false,
        message
    });
};

const sendNotFound = (res, message = "Resource not found") => {
    return res.status(404).json({
        success: false,
        message
    });
};

const sendConflict = (res, message = "Data already exists") => {
    return res.status(409).json({
        success: false,
        message
    });
};

const sendUnauthorized = (res, message = "Unauthorized") => {
    return res.status(401).json({
        success: false,
        message
    });
};

const sendForbidden = (res, message = "You do not have access to this") => {
    return res.status(403).json({
        success: false,
        message
    });
};

const sendTooManyRequests = (res, message = "Too many requests") => {
    return res.status(429).json({
        success: false,
        message
    });
};

// Never leak internals to the client in production; the full error still goes
// to the server log where it belongs.
const sendServerError = (res, error) => {
    console.error(error);
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
        success: false,
        message: isProd ? "Something went wrong. Please try again." : (error?.message || "Internal server error")
    });
};

export {
    sendSuccess,
    sendCreated,
    sendBadRequest,
    sendNotFound,
    sendConflict,
    sendUnauthorized,
    sendForbidden,
    sendTooManyRequests,
    sendServerError
};
