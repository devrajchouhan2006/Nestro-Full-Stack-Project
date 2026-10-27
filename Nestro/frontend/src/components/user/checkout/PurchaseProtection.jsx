import { IconShieldCheck, IconRefresh, IconTools, IconMapPin } from '@tabler/icons-react'

const protections = [
  { Icon: IconShieldCheck, label: '5-year warranty' },
  { Icon: IconRefresh, label: '30-day returns' },
  { Icon: IconTools, label: 'Free assembly' },
  { Icon: IconMapPin, label: 'Tracked delivery' },
]

export default function PurchaseProtection() {
  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <IconShieldCheck size={17} stroke={1.7} className="text-[#8B5E3C]" />
        <p className="text-[13px] font-medium text-[#1E1E1E]">Purchase protection</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {protections.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={14} stroke={1.7} className="text-[#8B5E3C] flex-shrink-0" />
            <span className="text-[11px] text-[#6B7280]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
