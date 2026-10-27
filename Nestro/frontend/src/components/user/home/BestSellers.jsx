import SectionHeader from '@website/ui/SectionHeader'
import ProductCard from '@website/ui/ProductCard'
import { fetchProduct } from '@/utils/api'
import { toProductCardProps } from '@/utils/productMapper'

export default async function BestSellers() {
  let { data: products } = await fetchProduct({ best_seller: 'true', limit: 4 })

  // No products flagged as bestseller yet — fall back to the newest arrivals
  // so the section still shows real catalog data instead of sitting empty.
  if (!products?.length) {
    ;({ data: products } = await fetchProduct({ limit: 4, sort: 'newest' }))
  }

  if (!products?.length) return null

  return (
    <section>
      <SectionHeader
        tag="Trending"
        title="Best Sellers"
        showLink
        linkHref="/store"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} {...toProductCardProps(product)} />
        ))}
      </div>
    </section>
  )
}
