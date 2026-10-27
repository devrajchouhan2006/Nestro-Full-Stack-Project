'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Button from '@website/ui/Button'

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop',
    tag: 'New Collection',
    title: 'Scandinavian',
    titleAccent: 'Simplicity',
    subtitle: 'Crafted for modern living',
    description: 'Discover furniture that blends timeless design with everyday comfort',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop',
    tag: 'Limited Edition',
    title: 'Minimalist',
    titleAccent: 'Elegance',
    subtitle: 'Where form meets function',
    description: 'Curated pieces that transform your space into a sanctuary',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1600&auto=format&fit=crop',
    tag: 'Bestsellers',
    title: 'Sustainable',
    titleAccent: 'Luxury',
    subtitle: 'Eco-conscious design',
    description: 'Premium furniture crafted from responsibly sourced materials',
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 3000)

    
    return () => clearInterval(interval)
  }, [])

  const slide = slides[current]

  return (
    <div className="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden bg-[#2C2016]">
      {/* Background Image — fade transition */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <Image
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A1208]/90 via-[#1A1208]/70 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-[600px]">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#D6BFA7] mb-2">
          {slide.tag}
        </span>
        <h1 className="text-3xl md:text-5xl font-normal text-white leading-tight mb-2">
          {slide.title} <span className="italic text-[#D6BFA7]">{slide.titleAccent}</span>
        </h1>
        <p className="text-sm md:text-base text-white/70 mb-1">{slide.subtitle}</p>
        <p className="text-xs md:text-sm text-white/50 mb-6">{slide.description}</p>
        <div className="flex gap-3">
          <Button variant="primary">Shop Now</Button>
          <Button variant="outline" className="text-white border-white/40 hover:bg-white/10">
            Explore
          </Button>
        </div>
      </div>

      {/* Dots only — no arrow buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === current ? 'w-8 bg-white' : 'w-3 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}