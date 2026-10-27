import { client } from "./helper"

/* -------------------------------------------------------------------------
   Every call resolves rather than throws, so a server component can render a
   sensible empty state instead of blowing up the whole page.
   ------------------------------------------------------------------------- */

const get = async (url, config) => {
    try {
        const response = await client.get(url, config)
        return response.data
    } catch (error) {
        return error.response?.data || { success: false, message: "Could not reach the server" }
    }
}

const send = async (method, url, body, config) => {
    try {
        const response = await client[method](url, body, config)
        return response.data
    } catch (error) {
        return error.response?.data || { success: false, message: "Could not reach the server" }
    }
}

/* ---------------------------------- catalogue --------------------------- */

export const fetchProduct = async (params = {}) => {
    const data = await get('product', { params })
    if (data.success) {
        return {
            data: data.products,
            total: data.total,
            page: data.page,
            pages: data.pages,
            success: true
        }
    }
    return { data: [], total: 0, page: 1, pages: 1, success: false }
}

export const fetchProductFacets = async () => {
    const data = await get('product/facets')
    if (data.success) {
        return {
            materials: data.materials,
            colors: data.colors,
            minPrice: data.minPrice,
            maxPrice: data.maxPrice,
            success: true
        }
    }
    return { materials: [], colors: [], minPrice: 0, maxPrice: 0, success: false }
}

// Accepts a Mongo id or a slug.
export const fetchProductById = async (id) => {
    const data = await get(`product/${id}`)
    if (data.success) return { data: data.product, success: true }
    return { data: null, success: false, message: data.message }
}

export const fetchProductSuggestions = async (q) => {
    const data = await get('product/suggest', { params: { q } })
    return data.success ? data.products : []
}

export const fetchCategory = async () => {
    const data = await get('category')
    return data.success ? { data: data.categories, success: true } : { data: [], success: false }
}

export const fetchCategoryById = async (id) => {
    const data = await get(`category/${id}`)
    return data.success ? { data: data.category, success: true } : { data: {}, success: false }
}

export const fetchRoom = async () => {
    const data = await get('room')
    return data.success ? { data: data.rooms, success: true } : { data: [], success: false }
}

export const fetchRoomById = async (id) => {
    const data = await get(`room/${id}`)
    return data.success ? { data: data.room, success: true } : { data: {}, success: false }
}

/* ---------------------------------- reviews ----------------------------- */

export const fetchReviews = async (productId) => {
    const data = await get(`product/${productId}/reviews`)
    return data.success
        ? { reviews: data.reviews, counts: data.counts, success: true }
        : { reviews: [], counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, success: false }
}

export const fetchFeaturedReviews = async () => {
    const data = await get('review/featured')
    return data.success ? data.reviews : []
}

export const createReview = (productId, payload) => send('post', `product/${productId}/reviews`, payload)
export const deleteReview = (id) => send('delete', `review/${id}`)

/* ------------------------------------ auth ------------------------------ */

const authRequest = (method, url, body) => send(method, `auth/${url}`, body)

export const signupRequest = (payload) => authRequest('post', 'signup', payload)
export const verifyOtpRequest = (payload) => authRequest('post', 'verify-otp', payload)
export const resendOtpRequest = (payload) => authRequest('post', 'resend-otp', payload)
export const signinRequest = (payload) => authRequest('post', 'signin', payload)
export const adminSigninRequest = (payload) => authRequest('post', 'admin/signin', payload)
export const forgotPasswordRequest = (payload) => authRequest('post', 'forgot-password', payload)
export const resetPasswordRequest = (payload) => authRequest('post', 'reset-password', payload)
export const logoutRequest = () => authRequest('post', 'logout')
export const fetchMeRequest = () => authRequest('get', 'me')

/* ---------------------------------- account ----------------------------- */

export const updateProfileRequest = (payload) => send('put', 'user/profile', payload)
export const changePasswordRequest = (payload) => send('put', 'user/password', payload)
export const fetchAccountStats = () => get('user/stats')

export const fetchServerCart = () => get('user/cart')
export const syncServerCart = (items) => send('put', 'user/cart', { items })
export const fetchServerWishlist = () => get('user/wishlist')
export const syncServerWishlist = (items) => send('put', 'user/wishlist', { items })

/* --------------------------------- addresses ---------------------------- */

export const fetchAddresses = () => get('address')
export const createAddress = (payload) => send('post', 'address', payload)
export const updateAddress = (id, payload) => send('put', `address/${id}`, payload)
export const setDefaultAddress = (id) => send('patch', `address/${id}/default`)
export const deleteAddress = (id) => send('delete', `address/${id}`)

/* ---------------------------------- orders ------------------------------ */

// The idempotency key identifies one checkout attempt. The server answers a
// repeat of the same key with the order it already made, so a double-click or a
// retried request can never turn into two orders — and two charges.
export const createOrder = (payload, idempotencyKey) =>
    send('post', 'order/create', payload, { headers: { 'Idempotency-Key': idempotencyKey } })

export const verifyPayment = (payload) => send('post', 'order/verify-payment', payload)
// Re-opens the payment window for an order abandoned at the Razorpay step.
export const retryOrderPayment = (id) => send('post', `order/${id}/pay`)
export const fetchMyOrders = (params = {}) => get('order', { params })
export const fetchMyOrder = (id) => get(`order/${id}`)
export const fetchOrderTransactions = (id) => get(`order/${id}/transactions`)
export const cancelOrder = (id, reason) => send('patch', `order/${id}/cancel`, { reason })
export const requestOrderReturn = (id, reason) => send('patch', `order/${id}/return`, { reason })

/* ---------------------------------- coupons ----------------------------- */

export const applyCoupon = (code, subtotal) => send('post', 'coupon/apply', { code, subtotal })

/* ----------------------------------- admin ------------------------------ */

export const fetchDashboard = () => get('admin/overview')
export const fetchCustomers = (params = {}) => get('admin/customers', { params })
export const fetchAdminOrders = (params = {}) => get('order/admin/all', { params })
export const fetchAdminOrder = (id) => get(`order/admin/${id}`)
export const updateOrderStatus = (id, payload) => send('patch', `order/admin/${id}/status`, payload)
export const fetchAdminTransactions = (params = {}) => get('order/admin/transactions', { params })
export const fetchAdminEnquiries = (params = {}) => get('contact/admin/all', { params })
export const updateEnquiryStatus = (id, status) => send('patch', `contact/admin/${id}`, { status })

export const fetchCoupons = () => get('coupon')
export const createCoupon = (payload) => send('post', 'coupon', payload)
export const updateCoupon = (id, payload) => send('put', `coupon/${id}`, payload)
export const deleteCoupon = (id) => send('delete', `coupon/${id}`)

export const removeProductImage = (id, url) => {
    // axios sends a delete body under `data`.
    return client.delete(`product/remove-image/${id}`, { data: { url } })
        .then((r) => r.data)
        .catch((e) => e.response?.data || { success: false, message: "Could not remove that image" })
}

/* ---------------------------------- contact ----------------------------- */

export const sendEnquiry = (payload) => send('post', 'contact/enquiry', payload)
export const subscribeNewsletter = (email) => send('post', 'contact/subscribe', { email })
