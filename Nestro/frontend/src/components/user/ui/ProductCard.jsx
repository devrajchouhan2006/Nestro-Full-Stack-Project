'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { IconHeart, IconArmchair } from '@tabler/icons-react'
import Badge from './Badge'
import RatingStars from './RatingStars'
import { addToCart } from '@/redux/slices/cartSlice'
import { toggleWishlist } from '@/redux/slices/wishlistSlice'

export default function ProductCard({
  id,
  image,
  category,
  name,
  price,
  rawPrice,
  oldPrice,
  rating,
  reviews,
  badge,
  soldOut = false,
}) {
  const dispatch = useDispatch()
  const inWishlist = useSelector((state) =>
    state.wishlist.items.some((item) => item.productId === id)
  )

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(addToCart({ productId: id, name, image, price: rawPrice ?? 0 }))
    toast.success(`${name} added to cart`)
  }

  const handleToggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(toggleWishlist({ productId: id, name, image, price: rawPrice ?? 0 }))
    toast.success(inWishlist ? `${name} removed from wishlist` : `${name} added to wishlist`)
  }

  return (
    <Link
      href={`/product/${id}`}
      className="group relative bg-white rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/3] rounded-t-xl overflow-hidden bg-[#F0EBE3]">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${soldOut ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C6A27E]/50">
            <IconArmchair size={40} stroke={1.2} />
          </div>
        )}

        {badge && !soldOut && (
          <div className="absolute top-3 left-3 z-10">
            <Badge type={badge.type} text={badge.text} />
          </div>
        )}

        {soldOut && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded bg-[#1E1E1E]/85 text-white">
              Sold out
            </span>
          </div>
        )}

        <button
          type="button"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm text-[#8B5E3C]"
        >
          <IconHeart size={13} stroke={1.8} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        {!soldOut && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute bottom-0 left-0 right-0 bg-[#2C2016]/90 text-[#D6BFA7] text-[11px] tracking-[0.1em] uppercase py-2.5 text-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 z-10"
          >
            Quick add
          </button>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col gap-1.5">
        {category && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#6B7280]">{category}</span>
        )}
        <p className="text-[13px] font-medium text-[#1E1E1E] leading-snug line-clamp-2">{name}</p>
        {rating !== undefined && <RatingStars rating={rating} reviews={reviews} />}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[14px] font-medium text-[#1E1E1E]">{price}</span>
          {oldPrice && <span className="text-[11px] line-through text-[#6B7280]">{oldPrice}</span>}
        </div>
      </div>
    </Link>
  )
}
