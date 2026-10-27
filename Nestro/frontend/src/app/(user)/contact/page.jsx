import {
  IconPhone, IconMail, IconMapPin, IconClock,
} from '@tabler/icons-react'
import Container from '@website/ui/Container'
import ContactForm from '@/components/user/ContactForm'

export const metadata = {
  title: 'Contact — Nestro',
  description: 'Talk to the Nestro team about an order, delivery, assembly or a trade enquiry.',
}

const channels = [
  { Icon: IconPhone, label: 'Phone', value: '+91 98765 43210', note: 'Mon–Sat, 10am–7pm IST' },
  { Icon: IconMail, label: 'Email', value: 'hello@nestro.in', note: 'We reply within one business day' },
  { Icon: IconMapPin, label: 'Studio', value: 'MI Road, Jaipur, Rajasthan', note: 'Visits by appointment' },
  { Icon: IconClock, label: 'Delivery support', value: 'Track from My Orders', note: 'Or ask us here' },
]

export default function ContactPage() {
  return (
    <Container className="mt-10 mb-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B5E3C] mb-1">Contact</p>
        <h1 className="text-2xl md:text-3xl font-normal text-[#1E1E1E] text-balance">
          Tell us what you need
        </h1>
        <p className="text-[14px] text-[#4A423B] mt-2 leading-relaxed">
          Questions about a piece, a delivery window, assembly, or a bulk order for a project —
          this reaches the same small team either way.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <ContactForm />

        <div className="flex flex-col gap-3">
          {channels.map(({ Icon, label, value, note }) => (
            <div key={label} className="bg-white border border-[#E8E0D5] rounded-xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-lg bg-[#F5EDE4] text-[#8B5E3C] flex items-center justify-center flex-shrink-0">
                <Icon size={17} stroke={1.7} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">{label}</p>
                <p className="text-[14px] font-medium text-[#1E1E1E] mt-0.5 break-words">{value}</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
