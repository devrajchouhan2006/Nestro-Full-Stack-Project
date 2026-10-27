import './globals.css'
import { Inter, Geist, Geist_Mono } from 'next/font/google'

// The one root layout for the whole app. Every nested layout below this —
// storefront, admin panel, admin sign-in — renders a plain wrapper, never its
// own <html>/<body>, because only one root may own the document.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Nestro — Curated Furniture',
    template: '%s',
  },
  description:
    'Scandinavian-inspired furniture for modern living, delivered and assembled across India.',
  openGraph: {
    siteName: 'Nestro',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      {/* Each section paints its own background on its wrapper; the body just
          carries the font variables and full height. */}
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
