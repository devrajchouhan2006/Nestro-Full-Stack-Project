import { Suspense } from 'react'
import Container from '@website/ui/Container'
import ProductCard from '@website/ui/ProductCard'
import { fetchProduct, fetchCategory, fetchRoom } from '@/utils/api'
import { toProductCardProps } from '@/utils/productMapper'
import SortBar from '@/components/user/store/SortBar'
import Pagination from '@/components/user/store/Pagination'
import PromoBanner from '@/components/user/store/PromoBanner'

// Live catalogue data: stock, prices and admin sessions all change between
// deploys, so these pages render per request rather than at build time.
export const dynamic = 'force-dynamic'


function renderProductCard(product) {
  return <ProductCard key={product._id} {...toProductCardProps(product)} />
}

export default async function StorePage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1

  const queryParams = {
    page,
    limit: 12,
    ...(params?.category && { category: params.category }),
    ...(params?.room && { room: params.room }),
    ...(params?.material && { material: params.material }),
    ...(params?.color && { color: params.color }),
    ...(params?.priceBand && { priceBand: params.priceBand }),
    ...(params?.inStock && { inStock: params.inStock }),
    ...(params?.sort && { sort: params.sort }),
  }

  const [{ data: products, total, pages }, categories, rooms] = await Promise.all([
    fetchProduct(queryParams),
    fetchCategory(),
    fetchRoom(),
  ])

  return (
    <Container className="mt-10 mb-20">
      <div className="flex flex-col gap-6">
        <Suspense fallback={null}>
          <SortBar total={total} categories={categories.data} rooms={rooms.data} />
        </Suspense>

        {products?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(renderProductCard)}
          </div>
        ) : (
          <div className="text-center text-[13px] text-[#6B7280] py-16">
            No products match the selected filters.
          </div>
        )}

        <PromoBanner />

        <Suspense fallback={null}>
          <Pagination page={page} pages={pages} />
        </Suspense>
      </div>
    </Container>
  )
}
