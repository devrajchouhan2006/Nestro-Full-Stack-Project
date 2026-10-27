'use client'

import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconHeart, IconCheck, IconAlertTriangle } from '@tabler/icons-react'
import RatingStars from '@/components/user/ui/RatingStars'
import QuantitySelector from './QuantitySelector'
import VariantSelector from './VariantSelector'
import ProductUSP from './ProductUSP'
import { addToCart } from '@/redux/slices/cartSlice'
import { toggleWishlist } from '@/redux/slices/wishlistSlice'
import { formatPrice } from '@/utils/helper'

export default function ProductInfo({ product }) {
  const dispatch = useDispatch()
  const router = useRouter()

  const variants = useMemo(() => product.variants || [], [product.variants])
  const [variantKey, setVariantKey] = useState(
    variants.find((v) => v.stockQty > 0)?.key || variants[0]?.key || ''
  )
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = useMemo(
    () => variants.find((v) => v.key === variantKey) || null,
    [variants, variantKey]
  )

  const price = selectedVariant?.salePrice ?? product.salePrice
  const originalPrice = selectedVariant?.originalPrice ?? product.originalPrice
  const available = selectedVariant ? selectedVariant.stockQty : (product.stockQty ?? 0)
  const saving = originalPrice > price ? originalPrice - price : 0

  const inWishlist = useSelector((state) =>
    state.wishlist.items.some((item) => item.productId === product._id)
  )

  const image = selectedVariant?.image || product.thumbnail || product.images?.[0] || null

  const cartLine = () => ({
    productId: product._id,
    variantKey: selectedVariant?.key || '',
    variantLabel: selectedVariant?.label || '',
    name: product.name,
    slug: product.slug,
    image,
    price,
    maxQty: available,
  })

  const handleAddToCart = () => {
    if (available < 1) return
    dispatch(addToCart({ ...cartLine(), quantity }))
    toast.success(`${product.name} added to cart`)
  }

  const handleBuyNow = () => {
    if (available < 1) return
    dispatch(addToCart({ ...cartLine(), quantity }))
    router.push('/checkout')
  }

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist({ productId: product._id, name: product.name, image, price }))
    toast.success(inWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {product.categoryId?.name && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#8B5E3C]">
            {product.categoryId.name}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-normal text-[#1E1E1E] leading-tight text-balance">
          {product.name}
        </h1>

        {product.ratingCount > 0 ? (
          <div className="flex items-center gap-2">
            <RatingStars rating={product.ratingAvg} reviews={product.ratingCount} />
            <a href="#reviews" className="text-[11px] text-[#8B5E3C] hover:underline">
              Read reviews
            </a>
          </div>
        ) : (
          <span className="text-[11px] text-[#6B7280]">No reviews yet</span>
        )}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <span className="text-2xl font-medium text-[#1E1E1E]">{formatPrice(price)}</span>
        {saving > 0 && (
          <>
            <span className="text-[14px] line-through text-[#6B7280]">{formatPrice(originalPrice)}</span>
            <span className="text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded">
              Save {formatPrice(saving)}
            </span>
          </>
        )}
      </div>

      {product.shortDescription && (
        <p className="text-[14px] text-[#4A423B] leading-relaxed max-w-prose">
          {product.shortDescription}
        </p>
      )}

      <VariantSelector variants={variants} selectedKey={variantKey} onSelect={setVariantKey} />

      {/* Stock is a real count now, so the message can be specific. */}
      {available < 1 ? (
        <p className="flex items-center gap-2 text-[13px] text-red-600">
          <IconAlertTriangle size={16} stroke={1.8} />
          Out of stock
        </p>
      ) : available <= (product.lowStockThreshold ?? 3) ? (
        <p className="flex items-center gap-2 text-[13px] text-[#96690A]">
          <IconAlertTriangle size={16} stroke={1.8} />
          Only {available} left
        </p>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-green-700">
          <IconCheck size={16} stroke={2} />
          In stock, ready to ship
        </p>
      )}

      {available > 0 && (
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} max={Math.min(available, 5)} />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={available < 1}
          className="flex-1 text-[11px] tracking-[0.08em] uppercase px-5 py-3.5 rounded font-medium transition-all bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {available < 1 ? 'Out of stock' : 'Add to cart'}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={available < 1}
          className="flex-1 text-[11px] tracking-[0.08em] uppercase px-5 py-3.5 rounded font-medium transition-all bg-[#2C2016] text-[#D6BFA7] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="w-12 h-12 flex-shrink-0 rounded border border-[#E8E0D5] flex items-center justify-center text-[#8B5E3C] hover:bg-[#F0EBE3] transition-colors"
        >
          <IconHeart size={18} stroke={1.8} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
      </div>

      <ProductUSP />
    </div>
  )
}
