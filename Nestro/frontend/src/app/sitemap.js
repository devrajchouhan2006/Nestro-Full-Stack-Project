import { fetchProduct, fetchCategory, fetchRoom } from '@/utils/api'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Rebuilt hourly rather than frozen at deploy time, so newly published products
// become discoverable without a redeploy.
export const revalidate = 3600

// Built at request time from the live catalogue, so a new product is
// discoverable the moment it is published.
export default async function sitemap() {
  const [{ data: products }, categories, rooms] = await Promise.all([
    fetchProduct({ status: 'true', limit: 60 }),
    fetchCategory(),
    fetchRoom(),
  ])

  const staticPages = ['', '/store', '/about', '/contact'].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  const productPages = (products || []).map((product) => ({
    url: `${SITE}/product/${product._id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const facetPages = [
    ...(categories.data || []).map((category) => `/store?category=${category._id}`),
    ...(rooms.data || []).map((room) => `/store?room=${room._id}`),
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...facetPages]
}
