import Link from 'next/link'
import { notFound } from 'next/navigation'
import Container from '@website/ui/Container'
import ProductGallery from '@website/product/ProductGallery'
import ProductInfo from '@website/product/ProductInfo'
import ProductTabs from '@website/product/ProductTabs'
import RelatedProducts from '@website/product/RelatedProducts'
import { fetchProductById, fetchReviews } from '@/utils/api'
import { galleryImages, getProductBadge } from '@/utils/productMapper'

// Live catalogue data: stock, prices and admin sessions all change between
// deploys, so these pages render per request rather than at build time.
export const dynamic = 'force-dynamic'


// Rendered on the server so crawlers and shared links see the real product.
export async function generateMetadata({ params }) {
  const { id } = await params
  const { data: product } = await fetchProductById(id)

  if (!product) return { title: 'Product not found — Nestro' }

  const image = product.thumbnail || product.images?.[0]
  const description =
    product.shortDescription ||
    `${product.name} from Nestro — ₹${Number(product.salePrice).toLocaleString('en-IN')}.`

  return {
    title: `${product.name} — Nestro`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: image ? [{ url: image }] : []
    }
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params

  const { data: product, success } = await fetchProductById(id)
  if (!success || !product) notFound()

  const { reviews, counts } = await fetchReviews(product._id)

  const images = galleryImages(product)
  const badge = getProductBadge(product)
  const categoryName = product.categoryId?.name
  const categoryId = product.categoryId?._id

  return (
    <>
      <Container className="mt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[11px] text-[#6B7280] flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/store" className="hover:text-[#8B5E3C] transition-colors">Store</Link>
            </li>
            {categoryName && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/store?category=${categoryId}`}
                    className="hover:text-[#8B5E3C] transition-colors"
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-[#1E1E1E] font-medium line-clamp-1">{product.name}</li>
          </ol>
        </nav>
      </Container>

      <Container className="mt-6">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          <ProductGallery images={images} badge={badge} name={product.name} />
          <ProductInfo product={product} />
        </div>
      </Container>

      <Container className="mt-14">
        <ProductTabs product={product} initialReviews={reviews} initialCounts={counts} />
      </Container>

      <Container className="mt-16 mb-20">
        <RelatedProducts productId={product._id} categoryId={categoryId} />
      </Container>
    </>
  )
}
