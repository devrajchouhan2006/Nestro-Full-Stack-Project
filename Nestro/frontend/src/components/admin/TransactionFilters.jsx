'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MdSearch, MdClose } from 'react-icons/md'

// Three independent axes rather than one long list: a shop asking "what cash is
// still outstanding" is filtering on state, not on payment type.
const GROUPS = [
  { param: 'kind', label: 'Type', options: [['', 'All'], ['payment', 'Payments'], ['refund', 'Refunds']] },
  { param: 'status', label: 'State', options: [['', 'All'], ['success', 'Settled'], ['pending', 'Pending'], ['failed', 'Failed']] },
  { param: 'method', label: 'Method', options: [['', 'All'], ['razorpay', 'Online'], ['cod', 'Cash']] },
]

export default function TransactionFilters({ total }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const push = (patch) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    // A narrower filter almost never has as many pages, so page one it is.
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `/admin/transactions?${qs}` : '/admin/transactions')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex gap-5 flex-wrap">
          {GROUPS.map((group) => {
            const active = searchParams.get(group.param) || ''
            return (
              <div key={group.param} className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wide text-gray-400">{group.label}</span>
                <div className="flex gap-1.5">
                  {group.options.map(([value, label]) => (
                    <button
                      key={value || 'all'}
                      type="button"
                      onClick={() => push({ [group.param]: value })}
                      className={`text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        active === value
                          ? 'bg-[#3b497e] text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap self-end">
          {total} row{total === 1 ? '' : 's'}
        </span>
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); push({ q: query.trim() }) }}
        className="relative max-w-sm"
      >
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <label className="sr-only" htmlFor="transaction-search">Search transactions</label>
        <input
          id="transaction-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Order number or payment id"
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
