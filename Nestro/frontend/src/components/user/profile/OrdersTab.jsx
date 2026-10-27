'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconArmchair, IconLoader2 } from '@tabler/icons-react'
import ProfileStats from './ProfileStats'
import OrderStatusBadge from '@website/order/OrderStatusBadge'
import { fetchMyOrders } from '@/utils/api'
import { formatPrice, formatDate } from '@/utils/helper'

export default function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    fetchMyOrders({ limit: 20 }).then((data) => {
      if (!alive) return
      if (data.success) { setOrders(data.orders); setState('ready') }
      else setState('error')
    })
    return () => { alive = false }
  }, [])

  return (
    <div>
      <ProfileStats />

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#6B7280] text-[13px]">
          <IconLoader2 size={16} className="animate-spin" /> Loading your orders…
        </div>
      )}

      {state === 'error' && (
        <p className="text-[13px] text-[#6B7280] bg-white border border-[#E8E0D5] rounded-xl p-6">
          We could not load your orders just now. Please refresh.
        </p>
      )}

      {state === 'ready' && orders.length === 0 && (
        <div className="bg-white border border-[#E8E0D5] rounded-xl p-10 text-center flex flex-col items-center gap-3">
          <IconArmchair size={34} stroke={1.2} className="text-[#C6A27E]" />
          <p className="text-[15px] font-medium text-[#1E1E1E]">No orders yet</p>
          <p className="text-[13px] text-[#6B7280]">When you order something, it will show up here.</p>
          <Link
            href="/store"
            className="mt-1 text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
          >
            Browse store
          </Link>
        </div>
      )}

      {state === 'ready' && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <article key={order._id} className="bg-white border border-[#E8E0D5] rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E8E0D5]">
                <div>
                  <Link
                    href={`/orders/${order._id}`}
                    className="text-[13px] font-medium text-[#1E1E1E] hover:text-[#8B5E3C]"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    {formatDate(order.createdAt)} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex flex-col gap-3">
                {order.items.slice(0, 2).map((item) => (
                  <div key={`${item.productId}-${item.variantKey}`} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                          <IconArmchair size={18} stroke={1.3} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#1E1E1E] line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-[#6B7280]">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-[11px] text-[#6B7280] pl-15">
                    + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8E0D5]">
                <span className="text-[14px] font-medium text-[#1E1E1E] tabular-nums">
                  {formatPrice(order.total)}
                </span>
                <Link
                  href={`/orders/${order._id}`}
                  className="text-[11px] tracking-[0.06em] uppercase text-[#8B5E3C] border-b border-[#C6A27E] pb-px hover:opacity-70"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
