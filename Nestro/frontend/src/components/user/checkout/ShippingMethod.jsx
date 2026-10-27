'use client'

import { IconTruck, IconRocket } from '@tabler/icons-react'
import { formatPrice } from '@/utils/helper'

// Fees mirror backend/src/utils/money.js. The server recomputes them anyway;
// these are for display only.
export const shippingOptions = [
  { id: 'standard', label: 'Standard Delivery', desc: '5-7 business days, free assembly', price: 0, Icon: IconTruck },
  { id: 'express', label: 'Express Delivery', desc: '2-3 business days', price: 1499, Icon: IconRocket },
]

export default function ShippingMethod({ selected, setSelected }) {
  return (
    <div className="flex flex-col gap-3">
      {shippingOptions.map((option) => {
        const active = selected === option.id
        const { Icon } = option
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`w-full flex items-center gap-4 border rounded-lg p-4 text-left transition-all ${
              active ? 'border-[#8B5E3C] bg-[#FFF8F5]' : 'border-[#E8E0D5] bg-white hover:border-[#C6A27E]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              active ? 'border-[#8B5E3C]' : 'border-[#C6A27E]'
            }`}>
              {active && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C]" />}
            </div>

            <Icon size={18} stroke={1.7} className="text-[#8B5E3C] flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#1E1E1E]">{option.label}</p>
              <p className="text-[11px] text-[#6B7280]">{option.desc}</p>
            </div>

            <span className={`text-[13px] font-medium flex-shrink-0 ${option.price === 0 ? 'text-green-700' : 'text-[#1E1E1E]'}`}>
              {option.price === 0 ? 'Free' : formatPrice(option.price)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
