import Container from '@website/ui/Container'
import ProductCard from '@website/ui/ProductCard'
import { fetchProduct } from '@/utils/api'
import { toProductCardProps } from '@/utils/productMapper'

// Live catalogue data: stock, prices and admin sessions all change between
// deploys, so these pages render per request rather than at build time.
export const dynamic = 'force-dynamic'


export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const q = params?.q?.trim()
  return { title: q ? `Search: ${q} — Nestro` : 'Search — Nestro' }
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams
  const q = (params?.q || '').trim()

  const { data: products, total } = q
    ? await fetchProduct({ q, status: 'true', limit: 24 })
    : { data: [], total: 0 }

  return (
    <Container className="mt-10 mb-20">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B5E3C] mb-1">Search</p>
        <h1 className="text-2xl md:text-3xl font-normal text-[#1E1E1E]">
          {q ? `Results for “${q}”` : 'What are you looking for?'}
        </h1>
        {q && (
          <p className="text-[13px] text-[#6B7280] mt-1">
            {total} {total === 1 ? 'piece' : 'pieces'} found
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} {...toProductCardProps(product)} />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[#6B7280] py-16 text-center">
          {q ? 'Nothing matched that search. Try a shorter phrase, or browse the store.' : 'Type a search from the header to begin.'}
        </p>
      )}
    </Container>
  )
}
