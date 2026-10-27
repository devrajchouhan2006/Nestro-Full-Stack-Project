import Image from 'next/image'

const stats = [
  { value: '15+', label: 'Years Experience' },
  { value: '5000+', label: 'Happy Customers' },
  { value: '98%', label: 'Satisfaction Rate' },
]

export default function CraftSection() {
  return (
    <section className="bg-[#2C2016] rounded-2xl px-6 md:px-12 py-12">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Left: Content */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#D6BFA7] mb-2 block">
              Our Story
            </span>
            <h2 className="text-2xl md:text-3xl font-normal text-white leading-tight mb-3">
              Crafted with <span className="italic text-[#D6BFA7]">Passion</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              At Nestro, we believe that furniture should be more than just functional—it should tell a story. Every piece is thoughtfully designed and meticulously crafted by skilled artisans who pour their expertise into creating timeless beauty.
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              We source sustainable materials and work closely with local craftspeople to ensure each item meets our exacting standards for quality, durability, and elegance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-1">
                <p className="text-2xl font-medium text-[#D6BFA7]">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-white/40">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative h-[320px] md:h-[380px] rounded-xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop"
            alt="Craftsmanship"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}