import Link from 'next/link'
import { fetchAdminTransactions } from '@/utils/api.server'
import TransactionFilters from '@/components/admin/TransactionFilters'

export const dynamic = 'force-dynamic'

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const when = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

const stateClasses = {
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
}

export default async function AdminTransactionsPage({ searchParams }) {
  const params = (await searchParams) || {}
  const data = await fetchAdminTransactions({
    page: params.page || 1,
    kind: params.kind || '',
    status: params.status || '',
    method: params.method || '',
    q: params.q || '',
  })

  const transactions = data.success ? data.transactions : []
  const summary = data.success ? data.summary : { collected: 0, refunded: 0, net: 0 }
  const page = data.page || 1
  const pages = data.pages || 1

  // Keeps the active filters when stepping through pages.
  const pageHref = (target) => {
    const next = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== 'page') next.set(key, value)
    })
    if (target > 1) next.set('page', String(target))
    const qs = next.toString()
    return qs ? `/admin/transactions?${qs}` : '/admin/transactions'
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Transactions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Every rupee in and out, independent of order status. Pending rows are cash on delivery
          not collected yet, so they do not count as income.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Collected', value: summary.collected, tone: 'text-green-700' },
          { label: 'Refunded', value: summary.refunded, tone: 'text-red-600' },
          { label: 'Net', value: summary.net, tone: 'text-gray-800' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-semibold mt-1 tabular-nums ${card.tone}`}>
              {rupees(card.value)}
            </p>
          </div>
        ))}
      </div>

      <TransactionFilters total={data.total || 0} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No transactions match that filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">State</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((entry) => (
                  <tr key={entry._id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-500 tabular-nums whitespace-nowrap">
                      {when(entry.createdAt)}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/${entry.orderId}`}
                        className="text-[#3b497e] hover:underline whitespace-nowrap"
                      >
                        {entry.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-500 break-all">
                      {entry.userId
                        ? [entry.userId.firstName, entry.userId.lastName].filter(Boolean).join(' ') || entry.userId.email
                        : '—'}
                    </td>
                    <td className="py-3 text-gray-800 capitalize whitespace-nowrap">
                      {entry.kind} · {entry.method === 'cod' ? 'cash' : 'online'}
                    </td>
                    <td className="py-3 text-gray-400 font-mono text-xs break-all max-w-[220px]">
                      {entry.providerPaymentId || entry.note || '—'}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        stateClasses[entry.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-medium tabular-nums whitespace-nowrap ${
                      entry.kind === 'refund' ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {entry.kind === 'refund' ? '−' : ''}{rupees(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, index) => index + 1).map((target) => (
            <Link
              key={target}
              href={pageHref(target)}
              aria-current={target === page ? 'page' : undefined}
              className={`w-8 h-8 rounded-md border text-xs font-medium flex items-center justify-center transition ${
                target === page
                  ? 'bg-[#3b497e] text-white border-[#3b497e]'
                  : 'border-gray-200 text-gray-600 hover:border-[#3b497e]'
              }`}
            >
              {target}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
