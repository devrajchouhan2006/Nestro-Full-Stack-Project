const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing behind a session, and nothing that would waste crawl budget.
      disallow: ['/admin', '/admin-login', '/checkout', '/cart', '/profile', '/orders', '/order-confirmed', '/auth'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
