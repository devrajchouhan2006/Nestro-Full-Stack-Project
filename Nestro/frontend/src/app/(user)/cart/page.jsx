'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { IconArmchair, IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import Container from '@website/ui/Container'
import OrderSummary from '@website/checkout/OrderSummary'
import { removeFromCart, updateQuantity, selectCartItems } from '@/redux/slices/cartSlice'
import { formatPrice } from '@/utils/helper'

export default function CartPage() {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)

  const handleRemove = (item) => {
    dispatch(removeFromCart({ productId: item.productId, variantKey: item.variantKey }))
    toast.success(`${item.name} removed from cart`)
  }

  if (cartItems.length === 0) {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-xl font-medium text-[#1E1E1E]">Your cart is empty</p>
          <p className="text-sm text-[#6B7280]">Add some products to see them here.</p>
          <Link
            href="/store"
            className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
          >
            Browse store
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="mt-10 mb-20">
      <h1 className="text-2xl font-medium text-[#1E1E1E] mb-8">Your cart</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full flex flex-col gap-4">
          {cartItems.map((item) => {
            const ceiling = item.maxQty ?? 20
            return (
              <div
                key={`${item.productId}-${item.variantKey || ''}`}
                className="bg-white border border-[#E8E0D5] rounded-xl p-4 flex gap-4 items-center flex-wrap sm:flex-nowrap"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0"
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                      <IconArmchair size={26} stroke={1.3} />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-[14px] font-medium text-[#1E1E1E] hover:text-[#8B5E3C] line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  {item.variantLabel && (
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{item.variantLabel}</p>
                  )}
                  <p className="text-[13px] text-[#8B5E3C] font-medium mt-1 tabular-nums">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="flex items-center border border-[#E8E0D5] rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, variantKey: item.variantKey, quantity: item.quantity - 1 }))}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:bg-[#F0EBE3] disabled:opacity-30 transition-colors"
                  >
                    <IconMinus size={13} stroke={2} />
                  </button>
                  <span className="w-10 h-8 flex items-center justify-center text-[13px] font-medium border-x border-[#E8E0D5] tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, variantKey: item.variantKey, quantity: item.quantity + 1 }))}
                    disabled={item.quantity >= ceiling}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:bg-[#F0EBE3] disabled:opacity-30 transition-colors"
                  >
                    <IconPlus size={13} stroke={2} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  aria-label={`Remove ${item.name}`}
                  className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <IconTrash size={16} stroke={1.7} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-4">
          <OrderSummary />
          <Link
            href="/checkout"
            className="w-full text-center text-[11px] tracking-[0.08em] uppercase px-5 py-3.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
          >
            Proceed to checkout
          </Link>
          <Link href="/store" className="text-center text-[12px] text-[#8B5E3C] hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </Container>
  )
}
