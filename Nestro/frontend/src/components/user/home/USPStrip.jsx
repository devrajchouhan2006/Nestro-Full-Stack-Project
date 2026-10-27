import {
  IconTruckDelivery,
  IconRefresh,
  IconShieldCheck,
  IconHeadset,
} from '@tabler/icons-react'

const usps = [
  { Icon: IconTruckDelivery, title: 'Free Shipping', subtitle: 'On orders above ₹25,000' },
  { Icon: IconRefresh, title: '30-Day Returns', subtitle: 'Hassle-free returns' },
  { Icon: IconShieldCheck, title: 'Secure Payment', subtitle: '100% protected checkout' },
  { Icon: IconHeadset, title: 'Expert Support', subtitle: '24/7 customer assistance' },
]

export default function USPStrip() {
  return (
    <section className="bg-white border border-[#E8E0D5] rounded-xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {usps.map(({ Icon, title, subtitle }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[#8B5E3C]">
              <Icon size={20} stroke={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E1E1E]">{title}</p>
              <p className="text-xs text-[#6B7280]">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}