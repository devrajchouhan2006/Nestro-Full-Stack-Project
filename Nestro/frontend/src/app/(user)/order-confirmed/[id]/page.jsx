'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useDispatch } from 'react-redux'
import { IconCircleCheck, IconLoader2, IconArmchair } from '@tabler/icons-react'
import Container from '@website/ui/Container'
import { clearCart } from '@/redux/slices/cartSlice'
import { fetchMyOrder } from '@/utils/api'
import { formatPrice, formatDate } from '@/utils/helper'

export default function OrderConfirmedPage({ params }) {
  const { id } = use(params)
  const dispatch = useDispatch()
  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    fetchMyOrder(id).then((data) => {
      if (!alive) return
      if (data.success) {
        setOrder(data.order)
        setState('ready')
        // Reaching this page means the order exists, so the basket that
        // produced it is spent. Clearing here as well as at checkout covers the
        // paths that skip the checkout handler entirely — a payment confirmed
        // by the Razorpay webhook, or a shopper who lands here from a link.
        dispatch(clearCart())
      } else setState('error')
    })
    return () => { alive = false }
  }, [id, dispatch])

  if (state === 'loading') {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex items-center justify-center gap-2 py-24 text-[#6B7280] text-[13px]">
          <IconLoader2 size={16} className="animate-spin" /> Fetching your order…
        </div>
      </Container>
    )
  }

  if (state === 'error' || !order) {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-xl font-medium text-[#1E1E1E]">We could not find that order</p>
          <Link href="/profile" className="text-[12px] text-[#8B5E3C] hover:underline">
            Go to my orders
          </Link>
        </div>
      </Container>
    )
  }

  const eta = new Date(order.createdAt)
  eta.setDate(eta.getDate() + (order.shippingMethod === 'express' ? 3 : 7))

  return (
    <Container className="mt-10 mb-20 max-w-3xl">
      <div className="flex flex-col items-center text-center gap-3 mb-10">
        <div className="w-14 h-14 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
          <IconCircleCheck size={30} stroke={1.6} />
        </div>
        <h1 className="text-2xl font-medium text-[#1E1E1E]">Thank you — your order is placed</h1>
        <p className="text-[13px] text-[#6B7280] max-w-md">
          Order <span className="font-medium text-[#1E1E1E]">{order.orderNumber}</span>.
          {' '}A confirmation is on its way to {order.email}.
        </p>
      </div>

      <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">Placed</p>
            <p className="text-[13px] text-[#1E1E1E] mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">Arriving by</p>
            <p className="text-[13px] text-[#1E1E1E] mt-0.5">{formatDate(eta)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">Payment</p>
            <p className="text-[13px] text-[#1E1E1E] mt-0.5">
              {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
            </p>
          </div>
        </div>

        <div className="border-t border-[#E8E0D5] pt-5 flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={`${item.productId}-${item.variantKey}`} className="flex gap-3 items-center">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                    <IconArmchair size={20} stroke={1.3} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1E1E1E] line-clamp-1">{item.name}</p>
                <p className="text-[11px] text-[#6B7280]">
                  {item.variantLabel ? `${item.variantLabel} · ` : ''}Qty {item.quantity}
                </p>
              </div>
              <span className="text-[13px] text-[#1E1E1E] tabular-nums">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E8E0D5] pt-5 flex justify-between items-center">
          <span className="text-[15px] font-medium text-[#1E1E1E]">Total paid</span>
          <span className="text-lg font-medium text-[#8B5E3C] tabular-nums">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link
          href={`/orders/${order._id}`}
          className="text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
        >
          Track this order
        </Link>
        <Link
          href="/store"
          className="text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded font-medium border border-[#C6A27E] text-[#8B5E3C] hover:bg-[#F0EBE3]"
        >
          Continue shopping
        </Link>
      </div>
    </Container>
  )
}
