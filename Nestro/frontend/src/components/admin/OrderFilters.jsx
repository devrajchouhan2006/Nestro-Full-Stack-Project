'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MdSearch, MdClose } from 'react-icons/md'

import { statusStyles } from './OrderStatusPill'

const statuses = [
  '', 'pending', 'confirmed', 'packed', 'dispatched', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'return_requested', 'returned', 'refunded',
]
// Labels come from the pill so a status is never worded two ways in the panel.
const labels = { '': 'All orders' }
const labelFor = (status) => labels[status] || statusStyles[status]?.label || status

export default function OrderFilters({ total }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const activeStatus = searchParams.get('status') || ''

  // Filtering always returns to page one; keeping the old page number would
  // land the user on an empty page.
  const push = (patch) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('page')
    router.push(`/admin/orders?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status || 'all'}
              type="button"
              onClick={() => push({ status })}
              className={`text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeStatus === status
                  ? 'bg-[#3b497e] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {labelFor(status)}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
          {total} order{total === 1 ? '' : 's'}
        </span>
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); push({ q: query.trim() }) }}
        className="relative max-w-sm"
      >
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <label className="sr-only" htmlFor="order-search">Search orders</label>
        <input
          id="order-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Order number or email"
          className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2 text-sm outline-none focus:border-[#3b497e] transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); push({ q: '' }) }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <MdClose />
          </button>
        )}
      </form>
    </div>
  )
}
