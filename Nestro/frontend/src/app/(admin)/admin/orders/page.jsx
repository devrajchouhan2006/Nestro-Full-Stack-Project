import Link from 'next/link'
import OrderStatusPill from '@/components/admin/OrderStatusPill'
import OrderFilters from '@/components/admin/OrderFilters'
import { fetchAdminOrders } from '@/utils/api.server'

export const dynamic = 'force-dynamic'

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const when = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function AdminOrdersPage({ searchParams }) {
  const params = await searchParams
  const page = Number(params?.page) || 1

  const data = await fetchAdminOrders({
    page,
    limit: 20,
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.q ? { q: params.q } : {}),
  })

  if (!data.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-800 font-medium">Could not load orders</p>
        <p className="text-sm text-gray-500 mt-1">{data.message}</p>
      </div>
    )
  }

  const { orders, total, pages } = data

  return (
    <div className="flex flex-col gap-4">
      <OrderFilters total={total} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">No orders match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Placed</th>
                  <th className="p-3 font-medium">Items</th>
                  <th className="p-3 font-medium">Payment</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <Link href={`/admin/orders/${order._id}`} className="font-medium text-gray-800 hover:text-[#3b497e]">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p className="text-gray-800">
                        {order.userId
                          ? [order.userId.firstName, order.userId.lastName].filter(Boolean).join(' ')
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{order.email}</p>
                    </td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{when(order.createdAt)}</td>
                    <td className="p-3 text-gray-500 tabular-nums">{order.items.length}</td>
                    <td className="p-3">
                      <OrderStatusPill status={order.paymentStatus} kind="payment" />
                      <p className="text-[11px] text-gray-400 mt-1 uppercase">{order.paymentMethod}</p>
                    </td>
                    <td className="p-3"><OrderStatusPill status={order.status} /></td>
                    <td className="p-3 text-right font-medium text-gray-800 tabular-nums whitespace-nowrap">
                      {rupees(order.total)}
                    </td>
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
              ...(params?.status ? { status: params.status } : {}),
              ...(params?.q ? { q: params.q } : {}),
              page: String(target),
            })
            return (
              <Link
                key={target}
                href={`/admin/orders?${query}`}
                aria-current={target === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm tabular-nums transition ${
                  target === page
                    ? 'bg-[#3b497e] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {target}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
