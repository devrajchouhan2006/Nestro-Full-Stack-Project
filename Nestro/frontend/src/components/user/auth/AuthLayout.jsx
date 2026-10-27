import {
  IconTruckDelivery,
  IconShieldCheck,
  IconRefresh,
  IconHeadset,
} from '@tabler/icons-react'

const features = [
  { Icon: IconTruckDelivery, text: 'Free delivery on orders above ₹25,000' },
  { Icon: IconShieldCheck,   text: '5-year warranty on all products' },
  { Icon: IconRefresh,       text: '30-day hassle-free returns' },
  { Icon: IconHeadset,       text: '24/7 expert support' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="grid md:grid-cols-2 min-h-[calc(100vh-58px)]">

      {/* Left Panel — hidden on mobile */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#2C2016] px-8 py-12 relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,#FAF7F4_1px,transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative z-10 max-w-[440px] flex flex-col gap-8">
          {/* Logo */}
          <div>
            <p className="text-[14px] text-[#FAF7F4] uppercase tracking-[0.14em] mb-6">
              NESTRO<span className="text-[#C6A27E]">.</span>
            </p>
            <h1 className="text-3xl font-normal text-white leading-tight mb-3">
              Discover <span className="italic text-[#D6BFA7]">Timeless</span> Furniture
            </h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Join our community of design enthusiasts. Sign in to access exclusive
              collections, track your orders, and enjoy personalised recommendations.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {features.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C6A27E]/15 flex items-center justify-center flex-shrink-0 text-[#D6BFA7]">
                  <Icon size={18} stroke={1.8} />
                </div>
                <p className="text-[13px] text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex items-center justify-center p-6 md:p-8 bg-[#F8F5F1]">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>

    </div>
  )
}