// Razorpay's checkout script is loaded on demand rather than in the app shell,
// so a shopper who never reaches checkout never pays for it.
const SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let pending = null

export const loadRazorpay = () => {
    if (typeof window === 'undefined') return Promise.resolve(false)
    if (window.Razorpay) return Promise.resolve(true)
    if (pending) return pending

    pending = new Promise((resolve) => {
        const existing = document.querySelector(`script[src="${SRC}"]`)
        if (existing) {
            existing.addEventListener('load', () => resolve(true))
            existing.addEventListener('error', () => resolve(false))
            return
        }
        const script = document.createElement('script')
        script.src = SRC
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => { pending = null; resolve(false) }
        document.body.appendChild(script)
    })

    return pending
}

/**
 * Opens Razorpay's checkout and resolves once the outcome is known.
 *
 * Both the checkout page and the "pay now" button on an unpaid order need the
 * identical dance — load the script, open the modal, hand the signature back to
 * the server, and treat a dismissed modal as a non-error. Keeping it here means
 * the verification step can never be forgotten in one of the two places.
 *
 * Resolves { status: 'paid' | 'dismissed' | 'failed', message? }.
 */
export const openRazorpayCheckout = async ({ razorpay, order, prefill = {}, verify }) => {
    const loaded = await loadRazorpay()
    if (!loaded || !window.Razorpay) {
        return { status: 'failed', message: 'Could not open the payment window. Please try again.' }
    }

    return new Promise((resolve) => {
        let settled = false
        const finish = (result) => {
            if (settled) return
            settled = true
            resolve(result)
        }

        const checkout = new window.Razorpay({
            key: razorpay.keyId,
            amount: razorpay.amount,
            currency: razorpay.currency,
            name: 'Nestro',
            description: `Order ${order.orderNumber}`,
            order_id: razorpay.orderId,
            prefill,
            theme: { color: '#8B5E3C' },
            // An order is only real once the server has verified the signature —
            // never on the browser's say-so.
            handler: async (response) => {
                const verified = await verify({
                    orderId: order._id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                })
                finish(verified.success
                    ? { status: 'paid' }
                    : { status: 'failed', message: verified.message || 'We could not confirm that payment' })
            },
            modal: {
                ondismiss: () => finish({ status: 'dismissed' }),
            },
        })

        checkout.on('payment.failed', (response) => {
            finish({
                status: 'failed',
                message: response?.error?.description || 'That payment did not go through',
            })
        })

        checkout.open()
    })
}
