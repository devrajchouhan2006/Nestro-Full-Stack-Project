'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PRICE_BANDS } from './FilterSidebarClient'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

export default function SortBar({ total = 0, categories = [], rooms = [] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryName = (id) => categories.find((c) => c._id === id)?.name || id
  const roomName = (id) => rooms.find((r) => r._id === id)?.name || id
  const priceBandLabel = (id) => PRICE_BANDS.find((band) => band.id === id)?.label || id

  const chips = []
  const category = searchParams.get('category')
  if (category) category.split(',').filter(Boolean).forEach((id) => chips.push({ key: 'category', value: id, label: categoryName(id) }))
  const room = searchParams.get('room')
  if (room) room.split(',').filter(Boolean).forEach((id) => chips.push({ key: 'room', value: id, label: roomName(id) }))
  const material = searchParams.get('material')
  if (material) material.split(',').filter(Boolean).forEach((m) => chips.push({ key: 'material', value: m, label: m }))
  const color = searchParams.get('color')
  if (color) color.split(',').filter(Boolean).forEach((c) => chips.push({ key: 'color', value: c, label: c }))
  const priceBand = searchParams.get('priceBand')
  if (priceBand) priceBand.split(',').filter(Boolean).forEach((id) => chips.push({ key: 'priceBand', value: id, label: priceBandLabel(id) }))
  if (searchParams.get('inStock') === 'true') {
    chips.push({ key: 'inStock', value: null, label: 'In Stock' })
  }

  const removeChip = (chip) => {
    const params = new URLSearchParams(searchParams.toString())
    if (chip.key === 'inStock') {
      params.delete('inStock')
    } else {
      const remaining = (params.get(chip.key) || '')
        .split(',')
        .filter(Boolean)
        .filter((v) => v !== chip.value)
      if (remaining.length) params.set(chip.key, remaining.join(','))
      else params.delete(chip.key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const onSortChange = (e) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === 'featured') params.delete('sort')
    else params.set('sort', e.target.value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      {/* Left: count + active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#6B7280] whitespace-nowrap">
          <span className="font-medium text-[#1E1E1E]">{total}</span> products found
        </span>
        {chips.map((chip) => (
          <span
            key={`${chip.key}-${chip.value}`}
            className="inline-flex items-center gap-1 bg-[#F5EDE4] text-[#8B5E3C] text-xs px-3 py-1 rounded-full"
          >
            {chip.label}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              className="hover:opacity-70 ml-0.5 cursor-pointer text-[10px]"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Right: sort dropdown */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-[#6B7280] hidden sm:block">Sort:</span>
        <select
          value={searchParams.get('sort') || 'featured'}
          onChange={onSortChange}
          className="border border-[#E8E0D5] rounded-md px-3 py-1.5 text-[12px] text-[#1E1E1E] bg-white outline-none cursor-pointer focus:border-[#C6A27E] transition-colors"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
