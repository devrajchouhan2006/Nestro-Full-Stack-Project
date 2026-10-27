import Link from 'next/link'
import Image from 'next/image'
import { IconTruck } from '@tabler/icons-react'
import { fetchProduct } from '@/utils/api'
import { formatPrice } from '@/utils/helper'

export default async function JustLanded() {
  let { data: products } = await fetchProduct({ newArrival: 'true', limit: 3, sort: 'newest' })

  // No products flagged as new arrivals yet — fall back to the newest
  // catalog additions so the section still shows real data.
  if (!products || products.length < 3) {
    ;({ data: products } = await fetchProduct({ limit: 3, sort: 'newest' }))
  }

  if (!products?.length) return null

  const [featured, ...rest] = products
  const centerProducts = rest.slice(0, 2)

  return (
    <section>

      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#8B5E3C] mb-2">
            NEW ARRIVALS
          </div>
          <h2 className="text-2xl md:text-3xl font-normal text-[#1E1E1E]">
            Just Landed
          </h2>
        </div>

        <Link
          href="/store"
          className="text-[12px] text-[#8B5E3C] border-b border-[#C6A27E] pb-px"
        >
          View all
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr_1fr] gap-4 items-start">

        {/* LEFT FEATURE CARD */}
        <div className="bg-[#2C2016] rounded-2xl p-6 flex flex-col gap-6 self-start">

          <div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-[#C6A27E] mb-3">
              FEATURED
            </div>

            <h3 className="text-[22px] text-white leading-tight mb-2">
              {featured.name}
            </h3>

            {featured.shortDescription && (
              <p className="text-[12px] text-white/60 mb-4">
                {featured.shortDescription}
              </p>
            )}

            <div className="text-[20px] text-[#D6BFA7] font-medium mb-4">
              {formatPrice(featured.salePrice)}
            </div>

            <Link
              href={`/product/${featured._id}`}
              className="inline-block bg-[#8B5E3C] hover:bg-[#6F4A2E] text-white px-5 py-2.5 rounded-md text-[11px] uppercase tracking-[0.06em]"
            >
              View in Store
            </Link>
          </div>

          <div className="relative w-full h-[200px] rounded-xl overflow-hidden">
            {featured.thumbnail && (
              <Image
                src={featured.thumbnail}
                alt={featured.name}
                fill
                className="object-cover"
              />
            )}
          </div>

        </div>

        <div className="flex flex-col gap-4">

          {centerProducts.map((product) => (
            <div
              key={product._id}
              className="rounded-xl overflow-hidden border border-[#E8E0D5] bg-white"
            >

              {/* Image */}
              <div className="relative h-[150px]">
                {product.thumbnail && (
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Body */}
              <div className="p-4">

                {/* Category */}
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#6B7280] mb-1">
                  {product.categoryId?.name}
                </div>

                {/* Title */}
                <div className="text-[13px] font-medium text-[#1E1E1E] mb-2">
                  {product.name}
                </div>

                {/* Stars + Price Row */}
                <div className="flex items-center justify-between">

                  {/* Stars */}
                  <div className="flex items-center gap-1 text-[#C6A27E]">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="text-[14px] font-medium text-[#1E1E1E]">
                    {formatPrice(product.salePrice)}
                  </div>

                </div>

              </div>
            </div>
          ))}

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">

          {/* Offer Card */}
          <div className="bg-[#F5EDE4] rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#8B5E3C] mb-2">
              OFFER
            </div>

            <div className="text-[14px] font-medium mb-1">
              First order 15% off
            </div>

            <div className="text-[12px] text-[#6B7280] mb-3">
              Use code Nestro15 at checkout
            </div>

            <Link
              href="/store"
              className="inline-block bg-[#8B5E3C] text-white px-4 py-2 rounded-md text-[11px]"
            >
              Shop Now
            </Link>
          </div>

          {/* Free Delivery */}
          <div className="bg-white border border-[#E8E0D5] rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#6B7280] mb-2">
              FREE DELIVERY
            </div>

            <div className="text-[14px] font-medium mb-1">
              On orders above ₹50,000
            </div>

            <div className="text-[12px] text-[#6B7280] mb-3">
              White glove service. Assembly included.
            </div>

            <div className="text-[#8B5E3C]">
              <IconTruck size={20} stroke={1.8} />
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
