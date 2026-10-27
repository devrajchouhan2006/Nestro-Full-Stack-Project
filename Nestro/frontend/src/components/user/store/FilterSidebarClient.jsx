'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function toCssColor(name) {
  return name.replace(/\s+/g, '').toLowerCase()
}

export const PRICE_BANDS = [
  { id: 'under-10k', label: 'Under ₹10,000' },
  { id: '10k-25k', label: '₹10,000 – ₹25,000' },
  { id: '25k-50k', label: '₹25,000 – ₹50,000' },
  { id: '50k-75k', label: '₹50,000 – ₹75,000' },
  { id: 'above-75k', label: 'Above ₹75,000' },
]

export default function FilterSidebarClient({ categories, rooms, materials = [], colors = [] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getList = (key) => {
    const value = searchParams.get(key)
    return value ? value.split(',').filter(Boolean) : []
  }

  const selectedCategories = getList('category')
  const selectedRooms = getList('room')
  const selectedMaterials = getList('material')
  const selectedColors = getList('color')
  const selectedPriceBands = getList('priceBand')
  const inStock = searchParams.get('inStock') === 'true'

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const toggleValue = (key, currentList, value) => {
    const next = currentList.includes(value)
      ? currentList.filter((item) => item !== value)
      : [...currentList, value]
    updateParams({ [key]: next })
  }

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  return (
    <aside className="bg-white border border-[#E8E0D5] rounded-xl p-6 sticky top-[72px] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#1E1E1E]">Filters</p>
        <button onClick={clearAll} className="text-[11px] text-[#8B5E3C] hover:underline">
          Clear All
        </button>
      </div>

      {/* Category */}
      <FilterGroup label="Category">
        {categories.map((cat) => (
          <CheckboxRow
            key={cat._id}
            label={cat.name}
            checked={selectedCategories.includes(cat._id)}
            onChange={() => toggleValue('category', selectedCategories, cat._id)}
          />
        ))}
      </FilterGroup>

      {/* Room */}
      <FilterGroup label="Room">
        {rooms.map((room) => (
          <CheckboxRow
            key={room._id}
            label={room.name}
            checked={selectedRooms.includes(room._id)}
            onChange={() => toggleValue('room', selectedRooms, room._id)}
          />
        ))}
      </FilterGroup>

      {/* Material */}
      {materials.length > 0 && (
        <FilterGroup label="Material">
          {materials.map((material) => (
            <CheckboxRow
              key={material}
              label={material}
              checked={selectedMaterials.includes(material)}
              onChange={() => toggleValue('material', selectedMaterials, material)}
            />
          ))}
        </FilterGroup>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <FilterGroup label="Color">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const active = selectedColors.includes(color)
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => toggleValue('color', selectedColors, color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    active ? 'border-[#8B5E3C] scale-110' : 'border-[#E8E0D5]'
                  }`}
                  style={{ backgroundColor: toCssColor(color) }}
                />
              )
            })}
          </div>
        </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup label="Price">
        {PRICE_BANDS.map((band) => (
          <CheckboxRow
            key={band.id}
            label={band.label}
            checked={selectedPriceBands.includes(band.id)}
            onChange={() => toggleValue('priceBand', selectedPriceBands, band.id)}
          />
        ))}
      </FilterGroup>

      {/* In Stock */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={() => updateParams({ inStock: inStock ? null : 'true' })}
          className="w-4 h-4 rounded border-[#C6A27E] accent-[#8B5E3C]"
        />
        <span className="text-[12px] text-[#1E1E1E]">In Stock Only</span>
      </label>
    </aside>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] tracking-[0.12em] uppercase text-[#6B7280] font-medium">
        {label}
      </p>
      {children}
    </div>
  )
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-[#C6A27E] accent-[#8B5E3C]"
      />
      <span className="text-[12px] text-[#1E1E1E] group-hover:text-[#8B5E3C] transition-colors">
        {label}
      </span>
    </label>
  )
}
