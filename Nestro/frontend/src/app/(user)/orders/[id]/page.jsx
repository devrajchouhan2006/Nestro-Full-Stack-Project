'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { IconLoader2, IconArmchair, IconArrowLeft } from '@tabler/icons-react'
import Container from '@website/ui/Container'
import OrderStatusBadge, {
  STATUS_FLOW, DERAILED, RETURN_WINDOW_DAYS, statusConfig,
} from '@website/order/OrderStatusBadge'
import {
  cancelOrder, fetchMyOrder, fetchOrderTransactions,
  requestOrderReturn, retryOrderPayment, verifyPayment,
} from '@/utils/api'
import { formatPrice, formatDate } from '@/utils/helper'
import { openRazorpayCheckout } from '@/utils/razorpay'

const CANCELLABLE = new Set(['pending', 'confirmed', 'packed'])

// Days left to ask for a return, or null once the order is outside the window.
const daysLeftToReturn = (deliveredAt) => {
  if (!deliveredAt) return null
  const days = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 86400000)
  const left = RETURN_WINDOW_DAYS - days
  return left >= 0 ? left : null
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params)
  const [order, setOrder] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [state, setState] = useState('loading')
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)
  const [returning, setReturning] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)

  const load = () =>
    Promise.all([fetchMyOrder(id), fetchOrderTransactions(id)]).then(([data, ledger]) => {
      if (data.success) { setOrder(data.order); setState('ready') }
      else setState('error')
      if (ledger.success) setTransactions(ledger.transactions)
    })

  useEffect(() => {
    let alive = true
    Promise.all([fetchMyOrder(id), fetchOrderTransactions(id)]).then(([data, ledger]) => {
      if (!alive) return
      if (data.success) { setOrder(data.order); setState('ready') }
      else setState('error')
      if (ledger.success) setTransactions(ledger.transactions)
    })
    return () => { alive = false }
  }, [id])

  // These handlers address the order by the id in the URL rather than by
  // order._id. They are defined above the "still loading" early return, so
  // anything they read from `order` is evaluated while it can still be null —
  // reading order._id here is what made this page blank out entirely.
  const handlePayNow = async () => {
    setPaying(true)
    const data = await retryOrderPayment(id)
    if (!data.success) {
      setPaying(false)
      return toast.error(data.message)
    }

    const result = await openRazorpayCheckout({
      razorpay: data.razorpay,
      order: data.order,
      prefill: {
        name: order?.shippingAddress?.fullName,
        email: order?.email,
        contact: order?.shippingAddress?.phone,
      },
      verify: verifyPayment,
    })
    setPaying(false)

    if (result.status === 'paid') {
      toast.success('Payment confirmed')
      return load()
    }
    if (result.status === 'dismissed') return toast.message('Payment cancelled')
    toast.error(result.message || 'That payment did not go through')
  }

  const handleCancel = async () => {
    setCancelling(true)
    const data = await cancelOrder(id, 'Changed my mind')
    setCancelling(false)
    if (!data.success) return toast.error(data.message)
    toast.success('Order cancelled')
    load()
  }

  const handleReturn = async () => {
    if (returnReason.trim().length < 3) return toast.error('Tell us briefly what went wrong')
    setReturning(true)
    const data = await requestOrderReturn(id, returnReason.trim())
    setReturning(false)
    if (!data.success) return toast.error(data.message)
    toast.success(data.message)
    setShowReturnForm(false)
    setReturnReason('')
    load()
  }

  if (state === 'loading') {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex items-center justify-center gap-2 py-24 text-[#6B7280] text-[13px]">
          <IconLoader2 size={16} className="animate-spin" /> Loading order…
        </div>
      </Container>
    )
  }

  if (state === 'error' || !order) {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-xl font-medium text-[#1E1E1E]">We could not find that order</p>
          <Link href="/profile" className="text-[12px] text-[#8B5E3C] hover:underline">Back to my orders</Link>
        </div>
      </Container>
    )
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status)
  const derailed = DERAILED.has(order.status)
  // An online order the shopper never finished paying for — still payable.
  const awaitingPayment =
    order.paymentMethod === 'razorpay' &&
    (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') &&
    !derailed

  const returnDaysLeft = order.status === 'delivered' ? daysLeftToReturn(order.deliveredAt) : null
  const returnable = returnDaysLeft !== null

  return (
    <Container className="mt-10 mb-20 max-w-3xl">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-[12px] text-[#8B5E3C] hover:underline mb-6">
        <IconArrowLeft size={14} stroke={1.8} /> My orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-medium text-[#1E1E1E]">Order {order.orderNumber}</h1>
          <p className="text-[12px] text-[#6B7280] mt-0.5">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress rail — only meaningful while the order is on the happy path. */}
      {!derailed && (
        <ol className="flex items-center mb-8">
          {STATUS_FLOW.map((step, index) => {
            const reached = index <= currentIndex
            return (
              <li key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${reached ? 'bg-[#8B5E3C]' : 'bg-[#E8E0D5]'}`} />
                  <span className={`text-[10px] uppercase tracking-[0.08em] ${reached ? 'text-[#8B5E3C]' : 'text-[#6B7280]'}`}>
                    {statusConfig[step].label}
                  </span>
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <span className={`h-[2px] flex-1 mx-1 mb-5 ${index < currentIndex ? 'bg-[#8B5E3C]' : 'bg-[#E8E0D5]'}`} />
                )}
              </li>
            )
          })}
        </ol>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] mb-2">Delivering to</p>
          <p className="text-[13px] font-medium text-[#1E1E1E]">{order.shippingAddress.fullName}</p>
          <p className="text-[12px] text-[#6B7280] leading-relaxed mt-1">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
            {order.shippingAddress.phone}
          </p>
        </div>

        <div className="bg-white border border-[#E8E0D5] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] mb-2">Payment</p>
          <p className="text-[13px] text-[#1E1E1E]">
            {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card / UPI / Netbanking'}
          </p>
          <p className="text-[12px] text-[#6B7280] mt-1 capitalize">Status: {order.paymentStatus}</p>
          {order.payment?.razorpayPaymentId && (
            <p className="text-[11px] text-[#6B7280] mt-1 font-mono break-all">
              {order.payment.razorpayPaymentId}
            </p>
          )}

          {awaitingPayment && (
            <button
              type="button"
              onClick={handlePayNow}
              disabled={paying}
              className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {paying && <IconLoader2 size={13} className="animate-spin" />}
              {paying ? 'Opening…' : `Pay ${formatPrice(order.total)}`}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E8E0D5] rounded-xl p-5 flex flex-col gap-4">
        {order.items.map((item) => (
          <div key={`${item.productId}-${item.variantKey}`} className="flex gap-3 items-center">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                  <IconArmchair size={22} stroke={1.3} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.productId}`} className="text-[13px] font-medium text-[#1E1E1E] hover:text-[#8B5E3C] line-clamp-1">
                {item.name}
              </Link>
              <p className="text-[11px] text-[#6B7280]">
                {item.variantLabel ? `${item.variantLabel} · ` : ''}Qty {item.quantity} · {formatPrice(item.price)}
              </p>
            </div>
            <span className="text-[13px] text-[#1E1E1E] tabular-nums">{formatPrice(item.lineTotal)}</span>
          </div>
        ))}

        <div className="border-t border-[#E8E0D5] pt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B7280]">Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B7280]">Delivery</span>
            <span className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B7280]">Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span className="text-green-700 tabular-nums">-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#E8E0D5]">
            <span className="text-[15px] font-medium text-[#1E1E1E]">Total</span>
            <span className="text-[15px] font-medium text-[#8B5E3C] tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {order.timeline?.length > 0 && (
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-5 mt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] mb-3">History</p>
          <ol className="flex flex-col gap-2">
            {order.timeline.map((entry, index) => (
              <li key={index} className="flex items-baseline gap-3 text-[12px]">
                <span className="text-[#6B7280] w-28 flex-shrink-0 tabular-nums">
                  {formatDate(entry.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[#1E1E1E]">
                  {statusConfig[entry.status]?.label || entry.status}
                  {entry.note ? ` — ${entry.note}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-5 mt-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280] mb-3">Payments</p>
          <ul className="flex flex-col gap-2">
            {transactions.map((entry) => (
              <li key={entry._id} className="flex items-baseline justify-between gap-3 text-[12px]">
                <span className="flex-1 min-w-0">
                  <span className="text-[#1E1E1E]">
                    {entry.kind === 'refund' ? 'Refund' : 'Payment'}
                    {entry.method === 'cod' ? ' · cash on delivery' : ' · online'}
                  </span>
                  {entry.note && <span className="text-[#6B7280]"> — {entry.note}</span>}
                </span>
                <span
                  className={`tabular-nums whitespace-nowrap ${
                    entry.status === 'success'
                      ? (entry.kind === 'refund' ? 'text-green-700' : 'text-[#1E1E1E]')
                      : entry.status === 'failed' ? 'text-red-600 line-through' : 'text-[#6B7280]'
                  }`}
                >
                  {entry.kind === 'refund' ? '+' : ''}{formatPrice(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.status === 'return_requested' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mt-4">
          <p className="text-[13px] font-medium text-orange-900">Return being reviewed</p>
          <p className="text-[12px] text-orange-800 mt-1">
            We have your request{order.returnReason ? ` — “${order.returnReason}”` : ''}. Someone
            will call to arrange the pickup, and the refund goes out once the piece is back with us.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {CANCELLABLE.has(order.status) && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-[12px] text-red-600 border border-red-200 rounded px-4 py-2.5 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel this order'}
          </button>
        )}

        {returnable && !showReturnForm && (
          <button
            type="button"
            onClick={() => setShowReturnForm(true)}
            className="text-[12px] text-[#8B5E3C] border border-[#E8E0D5] rounded px-4 py-2.5 hover:bg-[#FFF8F5] transition-colors"
          >
            Return this order
            <span className="text-[#6B7280]">
              {' · '}{returnDaysLeft === 0 ? 'last day' : `${returnDaysLeft} day${returnDaysLeft === 1 ? '' : 's'} left`}
            </span>
          </button>
        )}
      </div>

      {returnable && showReturnForm && (
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-5 mt-4 flex flex-col gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#1E1E1E]">What went wrong?</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Returns are open for {RETURN_WINDOW_DAYS} days after delivery. Tell us briefly and we
              will arrange a pickup.
            </p>
          </div>
          <textarea
            value={returnReason}
            onChange={(event) => setReturnReason(event.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Damaged on arrival, wrong colour, not as described…"
            className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#8B5E3C] transition resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReturn}
              disabled={returning}
              className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {returning ? 'Sending…' : 'Request return'}
            </button>
            <button
              type="button"
              onClick={() => { setShowReturnForm(false); setReturnReason('') }}
              className="text-[12px] text-[#6B7280] px-4 py-2.5 hover:text-[#1E1E1E] transition-colors"
            >
              Never mind
            </button>
          </div>
        </div>
      )}
    </Container>
  )
}
