'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { IconArmchair, IconTrash } from '@tabler/icons-react'
import Container from '@website/ui/Container'
import { removeFromWishlist } from '@/redux/slices/wishlistSlice'
import { addToCart } from '@/redux/slices/cartSlice'
import { formatPrice } from '@/utils/helper'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.wishlist.items)

  const moveToCart = (item) => {
    dispatch(addToCart({ productId: item.productId, name: item.name, image: item.image, price: item.price }))
    dispatch(removeFromWishlist(item.productId))
    toast.success(`${item.name} moved to cart`)
  }

  if (items.length === 0) {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-xl font-medium text-[#1E1E1E]">Your wishlist is empty</p>
          <p className="text-sm text-[#6B7280]">Tap the heart icon on any product to save it here.</p>
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
      <h1 className="text-2xl font-medium text-[#1E1E1E] mb-8">Your wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.productId} className="bg-white border border-[#E8E0D5] rounded-xl overflow-hidden flex flex-col">
            <Link href={`/product/${item.productId}`} className="relative aspect-[4/3] bg-[#F0EBE3] block">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                  <IconArmchair size={40} stroke={1.2} />
                </div>
              )}
            </Link>

            <div className="p-4 flex flex-col gap-2 flex-1">
              <Link href={`/product/${item.productId}`} className="text-[13px] font-medium text-[#1E1E1E] hover:text-[#8B5E3C] line-clamp-2">
                {item.name}
              </Link>
              <p className="text-[14px] font-medium text-[#8B5E3C] tabular-nums">{formatPrice(item.price)}</p>

              <div className="flex gap-2 mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => moveToCart(item)}
                  className="flex-1 text-[11px] tracking-[0.06em] uppercase px-3 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
                >
                  Move to cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(removeFromWishlist(item.productId))
                    toast.success(`${item.name} removed`)
                  }}
                  aria-label={`Remove ${item.name} from wishlist`}
                  className="w-10 flex items-center justify-center rounded border border-[#E8E0D5] text-[#6B7280] hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <IconTrash size={15} stroke={1.7} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}
