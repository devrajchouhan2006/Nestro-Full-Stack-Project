import Image from 'next/image'
import Button from '../ui/Button'

export default function StoreHero() {
  return (
    <div className="relative h-[300px] rounded-2xl overflow-hidden bg-gradient-to-r from-[#2C2016] to-[#5A3D24] flex items-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col gap-3 px-6 md:px-12 max-w-[520px]">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#D6BFA7]">
          All Collections
        </span>
        <h1 className="text-3xl md:text-4xl font-normal text-white leading-tight">
          Discover <span className="italic text-[#D6BFA7]">Timeless</span> Pieces
        </h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Carefully curated furniture designed to elevate every corner of your home.
        </p>
        <div className="mt-1">
          <Button variant="primary">Browse All</Button>
        </div>
      </div>

      {/* Right image — hidden on mobile */}
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[45%]">
        <Image
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop"
          alt="Store banner"
          fill
          priority
          sizes="45vw"
          className="object-cover"
        />
        {/* Fade overlay blending with bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C2016] via-[#2C2016]/10 to-transparent" />
      </div>
    </div>
  )
}