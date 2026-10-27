import Link from 'next/link'
import Image from 'next/image'
import SectionHeader from '@website/ui/SectionHeader'
import { fetchCategory } from '@/utils/api'

export default async function Categories() {
  const categories = await fetchCategory()
  return (
    <section>
      <SectionHeader tag="Shop by" title="Categories" showLink linkHref="/store" />

      {/* Mobile: Horizontal Scroll */}
      <div className="flex md:hidden overflow-x-auto gap-6 pb-2 scrollbar-none">
        {
        categories?.data.map((category) => (
          <Link
            key={category._id}
            href={`/store?category=${category._id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className="relative w-[88px] h-[88px] rounded-full border-2 border-[#E8E0D5] overflow-hidden bg-white group-hover:border-[#8B5E3C] group-hover:-translate-y-1 transition-all duration-300">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C6A27E]/40 text-2xl">
                  🛋
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-[#1E1E1E]">{category.name}</p>
              <p className="text-xs text-[#6B7280]">{category.count || 2} items</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-7 gap-6">
        {categories.data.map((category) => (
          <Link
            key={category._id}
            href={`/store?category=${category._id}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="relative w-[88px] h-[88px] rounded-full border-2 border-[#E8E0D5] overflow-hidden bg-white group-hover:border-[#8B5E3C] group-hover:-translate-y-1 transition-all duration-300">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C6A27E]/40 text-2xl">
                  🛋
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-[#1E1E1E]">{category.name}</p>
              <p className="text-xs text-[#6B7280]">{category.count || 0} items</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}