'use client'

import Image from 'next/image'
import { useSelector } from 'react-redux'
import { IconArmchair } from '@tabler/icons-react'
import { selectCartItems, selectCartSubtotal } from '@/redux/slices/cartSlice'
import { formatPrice } from '@/utils/helper'

export default function OrderSummary({ shippingCost = 0, discount = 0, couponCode = '' }) {
  const cartItems = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const total = Math.max(0, subtotal + shippingCost - discount)

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl p-6">
      <h3 className="text-[15px] font-medium text-[#1E1E1E] mb-5">Order summary</h3>

      <div className="flex flex-col gap-3 mb-6 max-h-[320px] overflow-y-auto">
        {cartItems.map((item) => (
          <div key={`${item.productId}-${item.variantKey || ''}`} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                  <IconArmchair size={22} stroke={1.3} />
                </div>
              )}
              <span className="absolute top-1 right-1 min-w-5 h-5 px-1 bg-[#8B5E3C] text-white text-[10px] rounded-full flex items-center justify-center tabular-nums">
                {item.quantity}
              </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="text-[13px] font-medium text-[#1E1E1E] line-clamp-1">{item.name}</p>
              {item.variantLabel && (
                <p className="text-[11px] text-[#6B7280]">{item.variantLabel}</p>
              )}
              <p className="text-[13px] font-medium text-[#8B5E3C] mt-auto">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#E8E0D5] mb-4" />

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between text-[13px]">
          <span className="text-[#6B7280]">Subtotal</span>
          <span className="text-[#1E1E1E] font-medium tabular-nums">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-[13px]">
          <span className="text-[#6B7280]">Delivery</span>
          <span className={`font-medium tabular-nums ${shippingCost === 0 ? 'text-green-700' : 'text-[#1E1E1E]'}`}>
            {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B7280]">Discount{couponCode ? ` (${couponCode})` : ''}</span>
            <span className="text-green-700 font-medium tabular-nums">-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      <div className="border-t-2 border-[#E8E0D5] pt-4">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-medium text-[#1E1E1E]">Total</span>
          <span className="text-lg font-medium text-[#8B5E3C] tabular-nums">{formatPrice(total)}</span>
        </div>
        <p className="text-[10px] text-[#6B7280] mt-1">Including all taxes</p>
      </div>
    </div>
  )
}
