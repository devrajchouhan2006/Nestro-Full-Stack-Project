'use client'

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function Pagination({ page = 1, pages = 1 }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (pages <= 1) return null

  const goToPage = (target) => {
    if (target < 1 || target > pages || target === page) return
    const params = new URLSearchParams(searchParams.toString())
    if (target === 1) params.delete('page')
    else params.set('page', target)
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1)

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Page numbers */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => goToPage(page - 1)}
          className="w-8 h-8 rounded-md border border-[#E8E0D5] flex items-center justify-center text-[#6B7280] hover:border-[#C6A27E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconChevronLeft size={14} stroke={1.8} />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            aria-label={`Page ${p}`}
            onClick={() => goToPage(p)}
            className={`w-8 h-8 rounded-md border text-[12px] font-medium transition-colors ${
              p === page
                ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]'
                : 'border-[#E8E0D5] text-[#6B7280] hover:border-[#C6A27E]'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          aria-label="Next page"
          disabled={page === pages}
          onClick={() => goToPage(page + 1)}
          className="w-8 h-8 rounded-md border border-[#E8E0D5] flex items-center justify-center text-[#6B7280] hover:border-[#C6A27E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconChevronRight size={14} stroke={1.8} />
        </button>
      </div>
    </div>
  )
}
