import {
  IconTruckDelivery,
  IconRefresh,
  IconTools,
  IconShieldCheck,
} from '@tabler/icons-react'

const usps = [
  { Icon: IconTruckDelivery, title: 'Free Delivery', subtitle: 'On standard shipping' },
  { Icon: IconRefresh, title: '30-Day Returns', subtitle: 'Hassle-free' },
  { Icon: IconTools, title: 'Expert Assembly', subtitle: 'White-glove service' },
  { Icon: IconShieldCheck, title: '5-Year Warranty', subtitle: 'Structural guarantee' },
]

export default function ProductUSP() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {usps.map(({ Icon, title, subtitle }) => (
        <div key={title} className="flex items-center gap-2 bg-[#FAFAF9] border border-[#E8E0D5] rounded-lg p-3">
          <div className="text-[#8B5E3C] flex-shrink-0">
            <Icon size={18} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#1E1E1E]">{title}</p>
            <p className="text-[10px] text-[#6B7280]">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
