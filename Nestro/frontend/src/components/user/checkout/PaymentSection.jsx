'use client'

import { IconCreditCard, IconCash, IconLock } from '@tabler/icons-react'

const methods = [
  {
    id: 'razorpay',
    label: 'Card, UPI or Netbanking',
    desc: 'Secure payment via Razorpay',
    Icon: IconCreditCard,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    Icon: IconCash,
  },
]

export default function PaymentSection({ selected, setSelected, onlineAvailable = true }) {
  return (
    <div className="flex flex-col gap-3">
      {methods.map((method) => {
        const disabled = method.id === 'razorpay' && !onlineAvailable
        const active = selected === method.id
        const { Icon } = method
        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => setSelected(method.id)}
            className={`w-full flex items-center gap-4 border rounded-lg p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
              <p className="text-[13px] font-medium text-[#1E1E1E]">{method.label}</p>
              <p className="text-[11px] text-[#6B7280]">
                {disabled ? 'Temporarily unavailable' : method.desc}
              </p>
            </div>
          </button>
        )
      })}

      <p className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-1">
        <IconLock size={13} stroke={1.8} />
        Card details are entered on Razorpay&apos;s secure page — Nestro never sees or stores them.
      </p>
    </div>
  )
}
