import { cookies } from 'next/headers'

/* -------------------------------------------------------------------------
   Server-side twin of utils/api.js, for the admin pages that render on the
   server.

   Those pages run inside Next's Node process, not the browser, so the axios
   client in utils/api.js has no session cookie to send and every admin call
   comes back 401 — which is why an admin page could look "broken" while the
   API itself was perfectly healthy. Here the incoming request's cookies are
   read and forwarded explicitly.

   Every call resolves rather than throws, matching utils/api.js, so a page can
   render an empty state instead of crashing the route.
   ------------------------------------------------------------------------- */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const toQuery = (params = {}) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    })
    const qs = search.toString()
    return qs ? `?${qs}` : ''
}

const authedGet = async (path, params) => {
    try {
        const jar = await cookies()
        const cookieHeader = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ')

        const response = await fetch(`${BASE}${path}${toQuery(params)}`, {
            headers: cookieHeader ? { cookie: cookieHeader } : {},
            // Admin screens must never show a cached snapshot of someone's
            // orders — always read through.
            cache: 'no-store',
        })
        return await response.json()
    } catch {
        return { success: false, message: 'Could not reach the server' }
    }
}

/* ----------------------------------- admin ------------------------------ */

export const fetchDashboard = () => authedGet('admin/overview')
export const fetchCustomers = (params = {}) => authedGet('admin/customers', params)
export const fetchAdminOrders = (params = {}) => authedGet('order/admin/all', params)
export const fetchAdminOrder = (id) => authedGet(`order/admin/${id}`)
export const fetchAdminTransactions = (params = {}) => authedGet('order/admin/transactions', params)
