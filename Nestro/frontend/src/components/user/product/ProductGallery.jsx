'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconArmchair } from '@tabler/icons-react'
import Badge from '@/components/user/ui/Badge'

export default function ProductGallery({ images = [], badge, name = 'Product' }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F0EBE3] group">
        {active ? (
          <Image
            src={active}
            alt={`${name} — image ${activeIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
            <IconArmchair size={64} stroke={1.2} />
          </div>
        )}

        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <Badge type={badge.type} text={badge.text} />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === index
                  ? 'border-[#8B5E3C] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90 hover:border-[#C6A27E]'
              }`}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
