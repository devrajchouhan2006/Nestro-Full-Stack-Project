import { fetchCustomers } from '@/utils/api.server'

export const dynamic = 'force-dynamic'

const when = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function CustomersPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1

  const data = await fetchCustomers({ page, limit: 25, ...(params?.q ? { q: params.q } : {}) })

  if (!data.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-800 font-medium">Could not load customers</p>
        <p className="text-sm text-gray-500 mt-1">{data.message}</p>
      </div>
    )
  }

  const { customers, total, pages } = data

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <form action="/admin/customers" className="flex gap-2 max-w-sm w-full">
          <label className="sr-only" htmlFor="customer-search">Search customers</label>
          <input
            id="customer-search"
            name="q"
            defaultValue={params?.q || ''}
            placeholder="Name, email or phone"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3b497e] transition"
          />
          <button type="submit" className="bg-[#3b497e] text-white text-sm px-4 rounded-lg hover:bg-[#2f3b69] transition">
            Search
          </button>
        </form>
        <span className="text-xs text-gray-400 tabular-nums">
          {total} customer{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {customers.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No customers match that search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Verified</th>
                  <th className="p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">
                      {[customer.firstName, customer.lastName].filter(Boolean).join(' ')}
                    </td>
                    <td className="p-3 text-gray-600 break-all">{customer.email}</td>
                    <td className="p-3 text-gray-600">{customer.phone || '—'}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        customer.isVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {customer.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 tabular-nums whitespace-nowrap">{when(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }).map((_, index) => {
            const target = index + 1
            const query = new URLSearchParams({
              ...(params?.q ? { q: params.q } : {}),
              page: String(target),
            })
            return (
              <a
                key={target}
                href={`/admin/customers?${query}`}
                aria-current={target === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm tabular-nums transition ${
                  target === page
                    ? 'bg-[#3b497e] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {target}
              </a>
            )
          })}
        </nav>
      )}
    </div>
  )
}
