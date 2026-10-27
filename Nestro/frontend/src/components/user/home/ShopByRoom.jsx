import Link from 'next/link'
import Image from 'next/image'
import SectionHeader from '@website/ui/SectionHeader'
import { fetchRoom } from '@/utils/api'

export default async function ShopByRoom() {
  const { data: rooms } = await fetchRoom()

  if (!rooms?.length) return null

  return (
    <section>
      <SectionHeader tag="Explore" title="Shop by Room" showLink linkHref="/store" />

      {/* Mobile: Stacked vertical */}
      <div className="flex md:hidden flex-col gap-4">
        {rooms.map((room) => (
          <Link
            key={room._id}
            href={`/store?room=${room._id}`}
            className="relative h-[200px] rounded-xl overflow-hidden group"
          >
            {room.image && (
              <Image
                src={room.image}
                alt={room.name}
                fill
                sizes="100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-lg font-medium text-white">{room.name}</p>
              <p className="text-xs text-white/70">{room.count || 0} items</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: Complex grid */}
      <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-4 h-[380px]">
        {rooms.map((room, index) => (
          <Link
            key={room._id}
            href={`/store?room=${room._id}`}
            className={`relative rounded-xl overflow-hidden group ${
              index === 0 ? 'col-span-1 row-span-2' : ''
            }`}
          >
            {room.image && (
              <Image
                src={room.image}
                alt={room.name}
                fill
                sizes={index === 0 ? '33vw' : '22vw'}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-lg font-medium text-white">{room.name}</p>
              <p className="text-xs text-white/70">{room.count || 0} items</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
