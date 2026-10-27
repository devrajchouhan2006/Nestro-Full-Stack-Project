import SectionHeader from '@/components/user/ui/SectionHeader'
import ProductCard from '@/components/user/ui/ProductCard'
import { fetchProduct } from '@/utils/api'
import { toProductCardProps } from '@/utils/productMapper'

// Server component: asks the API for four more products in the same category,
// excluding the one being viewed.
export default async function RelatedProducts({ productId, categoryId }) {
  if (!categoryId) return null

  const { data: products } = await fetchProduct({
    category: categoryId,
    exclude: productId,
    status: 'true',
    limit: 4,
  })

  if (!products?.length) return null

  return (
    <section>
      <SectionHeader
        tag="You may also like"
        title="Related products"
        showLink
        linkHref={`/store?category=${categoryId}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} {...toProductCardProps(product)} />
        ))}
      </div>
    </section>
  )
}
