'use client'

import { IconMinus, IconPlus } from '@tabler/icons-react'

export default function QuantitySelector({ quantity, setQuantity, max = 5 }) {
  const ceiling = Math.max(1, Math.min(max, 20))
  const decrement = () => setQuantity((prev) => Math.max(1, prev - 1))
  const increment = () => setQuantity((prev) => Math.min(ceiling, prev + 1))

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">Quantity</p>
      <div className="flex items-center border border-[#E8E0D5] rounded-md overflow-hidden w-fit">
        <button
          type="button"
          onClick={decrement}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:bg-[#F0EBE3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <IconMinus size={14} stroke={2} />
        </button>

        <span className="w-12 h-10 flex items-center justify-center text-[14px] font-medium text-[#1E1E1E] border-x border-[#E8E0D5] tabular-nums">
          {quantity}
        </span>

        <button
          type="button"
          onClick={increment}
          disabled={quantity >= ceiling}
          aria-label="Increase quantity"
          className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:bg-[#F0EBE3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <IconPlus size={14} stroke={2} />
        </button>
      </div>
      {quantity >= ceiling && (
        <p className="text-[11px] text-[#8B5E3C]">
          {ceiling < 5 ? `Only ${ceiling} left in stock` : `Maximum ${ceiling} units per order`}
        </p>
      )}
    </div>
  )
}
