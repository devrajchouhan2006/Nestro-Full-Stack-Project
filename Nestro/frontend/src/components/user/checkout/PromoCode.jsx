'use client'

import { useState } from 'react'
import { IconX, IconTag } from '@tabler/icons-react'
import { applyCoupon } from '@/utils/api'
import { formatPrice } from '@/utils/helper'

// Validation happens on the server; the discount shown here is what the order
// endpoint will recompute and charge.
export default function PromoCode({ subtotal, applied, onApply, onClear, disabled }) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const handleApply = async () => {
    const trimmed = code.trim()
    if (!trimmed) return setError('Enter a code first')

    setChecking(true)
    setError(null)
    const data = await applyCoupon(trimmed, subtotal)
    setChecking(false)

    if (!data.success) return setError(data.message)
    onApply(data.coupon)
    setCode('')
  }

  if (applied) {
    return (
      <div className="bg-white border border-[#E8E0D5] rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 bg-[#F0FDF4] text-[#166534] rounded-md px-3 py-2.5">
          <span className="flex items-center gap-2 text-[12px] font-medium min-w-0">
            <IconTag size={14} stroke={1.8} className="flex-shrink-0" />
            <span className="truncate">{applied.code} applied — you save {formatPrice(applied.discount)}</span>
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove promo code"
            className="text-[#166534] hover:opacity-70 flex-shrink-0"
          >
            <IconX size={15} stroke={2} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl p-4">
      <p className="text-[13px] font-medium text-[#1E1E1E] mb-3">Promo code</p>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="promo">Promo code</label>
        <input
          id="promo"
          value={code}
          disabled={disabled}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply() } }}
          placeholder="Enter code"
          className="flex-1 min-w-0 border border-[#E8E0D5] rounded-md px-3 py-2 text-[13px] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa] uppercase"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={checking || disabled}
          className="px-4 py-2 bg-[#2C2016] text-[#D6BFA7] text-[11px] tracking-[0.06em] uppercase rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {checking ? '…' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-[11px] mt-2 px-3 py-1.5 rounded bg-red-50 text-red-600">{error}</p>}
    </div>
  )
}
