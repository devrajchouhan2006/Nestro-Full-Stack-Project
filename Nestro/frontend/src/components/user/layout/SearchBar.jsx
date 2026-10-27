'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { IconSearch, IconX, IconArmchair } from '@tabler/icons-react'
import { fetchProductSuggestions } from '@/utils/api'
import { formatPrice } from '@/utils/helper'

export default function SearchBar({ onClose }) {
  const router = useRouter()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  const trimmed = query.trim()
  const open = trimmed.length >= 2
  // Derived, not stored: a query too short to search simply has no results,
  // so there is nothing to write back into state.
  const visible = open ? results : []

  // Debounced so a fast typist makes one request, not eight.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return undefined

    let alive = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const products = await fetchProductSuggestions(term)
      if (!alive) return
      setResults(products)
      setLoading(false)
    }, 250)

    return () => { alive = false; clearTimeout(timer) }
  }, [query])

  const submit = (event) => {
    event.preventDefault()
    if (!trimmed) return
    onClose?.()
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative">
        <IconSearch size={16} stroke={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose?.() }}
          placeholder="Search sofas, tables, lighting…"
          aria-label="Search products"
          className="w-full border border-[#E8E0D5] rounded-md pl-9 pr-9 py-2.5 text-[13px] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]"
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1E1E1E]"
          >
            <IconX size={15} stroke={1.8} />
          </button>
        )}
      </form>

      {open && (
        <div className="mt-2 bg-white border border-[#E8E0D5] rounded-lg overflow-hidden shadow-sm">
          {loading && <p className="px-4 py-3 text-[12px] text-[#6B7280]">Searching…</p>}

          {!loading && visible.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-[#6B7280]">
              Nothing matched “{trimmed}”.
            </p>
          )}

          {!loading && visible.map((product) => (
            <Link
              key={product._id}
              href={`/product/${product._id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8F5F1] transition-colors border-b border-[#F0EBE3] last:border-0"
            >
              <div className="relative w-10 h-10 rounded bg-[#F0EBE3] overflow-hidden flex-shrink-0">
                {product.thumbnail ? (
                  <Image src={product.thumbnail} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C6A27E]">
                    <IconArmchair size={16} stroke={1.3} />
                  </div>
                )}
              </div>
              <span className="flex-1 min-w-0 text-[13px] text-[#1E1E1E] truncate">{product.name}</span>
              <span className="text-[12px] text-[#8B5E3C] tabular-nums flex-shrink-0">
                {formatPrice(product.salePrice)}
              </span>
            </Link>
          ))}

          {!loading && visible.length > 0 && (
            <button
              type="button"
              onClick={submit}
              className="w-full px-4 py-2.5 text-[12px] text-[#8B5E3C] hover:bg-[#F8F5F1] text-left"
            >
              See all results for “{trimmed}”
            </button>
          )}
        </div>
      )}
    </div>
  )
}
