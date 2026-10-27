// A section layout, not a root one: src/app/layout.jsx owns <html> and <body>.
export const metadata = {
  title: 'Sign in — Nestro Admin',
  robots: { index: false, follow: false },
}

export default function AdminLoginLayout({ children }) {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] h-full">
      {children}
    </div>
  )
}
