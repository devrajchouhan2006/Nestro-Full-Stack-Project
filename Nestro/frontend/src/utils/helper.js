import axios from "axios";

const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
});

function generateSlug(value) {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function formatPrice(value) {
    if (value === undefined || value === null) return null
    return `₹${Number(value).toLocaleString('en-IN')}`
}

function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', opts)
}

// Axios error -> the message the API actually sent, with a usable fallback.
function apiMessage(error, fallback = 'Something went wrong, please try again') {
    return error?.response?.data?.message || error?.message || fallback
}

export { client, generateSlug, formatPrice, formatDate, apiMessage }
