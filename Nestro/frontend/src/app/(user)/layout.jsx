import { Toaster } from 'sonner'
import Navbar from '@website/layout/Navbar'
import Footer from '@website/layout/Footer'
import ReduxProvider from '@/redux/ReduxProvider'

// A section layout, not a root one: src/app/layout.jsx owns <html> and <body>.
export const metadata = {
  title: {
    default: 'Nestro — Curated Furniture',
    template: '%s',
  },
  description:
    'Scandinavian-inspired furniture for modern living, delivered and assembled across India.',
}

export default function StorefrontLayout({ children }) {
  return (
    <div className="font-[family-name:var(--font-inter)] min-h-screen bg-[#F8F5F1]">
      <ReduxProvider>
        <Toaster position="top-right" richColors />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </ReduxProvider>
    </div>
  )
}
