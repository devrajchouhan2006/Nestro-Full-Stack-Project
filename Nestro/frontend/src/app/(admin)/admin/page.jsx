import Link from 'next/link'
import { FaShoppingBag, FaWallet, FaUserPlus, FaBoxOpen } from 'react-icons/fa'
import StatCard from '@/components/admin/StatCard'
import RevenueChart from '@/components/admin/RevenueChart'
import OrderStatusPill from '@/components/admin/OrderStatusPill'
import SetupChecklist from '@/components/admin/SetupChecklist'
import { fetchDashboard } from '@/utils/api.server'

export const dynamic = 'force-dynamic'

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export default async function Dashboard() {
  const data = await fetchDashboard()

  if (!data.success) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-800 font-medium">Could not load the dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{data.message}</p>
        </div>
      </div>
    )
  }

  const { stats, series, topProducts, lowStock, recentOrders, config } = data

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <SetupChecklist config={config} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Revenue (30 days)"
          value={rupees(stats.revenue30d)}
          changePct={stats.revenueChangePct}
          sub="vs previous 30"
          Icon={FaWallet}
          tone="blue"
        />
        <StatCard
          label="Orders (30 days)"
          value={stats.orders30d}
          sub={`${stats.totalOrders} all time`}
          Icon={FaShoppingBag}
          tone="green"
        />
        <StatCard
          label="Customers"
          value={stats.customers}
          sub="verified accounts"
          Icon={FaUserPlus}
          tone="purple"
        />
        <StatCard
          label="Needs action"
          value={stats.openOrders}
          sub="orders to fulfil"
          Icon={FaBoxOpen}
          tone="amber"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Revenue, last 30 days</h2>
          <span className="text-xs text-gray-400">Paid orders only</span>
        </div>
        {series.some((day) => day.revenue > 0) ? (
          <RevenueChart series={series} />
        ) : (
          <p className="text-sm text-gray-400 py-16 text-center">
            No paid orders in the last 30 days yet.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 px-2">
                        <Link href={`/admin/orders/${order._id}`} className="font-medium text-gray-800 hover:text-[#3b497e]">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{order.email}</p>
                      </td>
                      <td className="py-2.5 px-2"><OrderStatusPill status={order.status} /></td>
                      <td className="py-2.5 px-2 text-right font-medium text-gray-800 tabular-nums whitespace-nowrap">
                        {rupees(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link href="/admin/orders" className="inline-block mt-4 text-xs text-[#3b497e] hover:underline">
            View all orders →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Best sellers</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nothing sold yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topProducts.map((product) => (
                <li key={String(product._id)} className="flex items-center gap-3">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{product.name}</span>
                  <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">{product.units} sold</span>
                  <span className="text-sm font-medium text-gray-800 tabular-nums whitespace-nowrap">
                    {rupees(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Running low</h2>
          <p className="text-xs text-gray-500 mb-4">At or below their low-stock threshold.</p>
          <ul className="flex flex-col gap-2">
            {lowStock.map((product) => (
              <li key={String(product._id)} className="flex items-center gap-3">
                <Link
                  href={`/admin/products/edit/${product._id}`}
                  className="flex-1 min-w-0 text-sm text-gray-800 truncate hover:text-[#3b497e]"
                >
                  {product.name}
                </Link>
                <span className={`text-xs font-medium tabular-nums px-2 py-0.5 rounded-full ${
                  product.stockQty === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                }`}>
                  {product.stockQty === 0 ? 'Out of stock' : `${product.stockQty} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
