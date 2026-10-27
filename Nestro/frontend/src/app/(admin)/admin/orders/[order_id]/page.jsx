import Link from 'next/link'
import { notFound } from 'next/navigation'
import OrderStatusPill from '@/components/admin/OrderStatusPill'
import OrderStatusControl from '@/components/admin/OrderStatusControl'
import { fetchAdminOrder } from '@/utils/api.server'

export const dynamic = 'force-dynamic'

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const when = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export default async function AdminOrderDetail({ params }) {
  const { order_id } = await params
  const data = await fetchAdminOrder(order_id)

  if (!data.success) notFound()
  const { order, transactions = [] } = data

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <Link href="/admin/orders" className="text-sm text-[#3b497e] hover:underline">
        ← All orders
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Placed {when(order.createdAt)}</p>
          <div className="flex gap-2 mt-3">
            <OrderStatusPill status={order.status} />
            <OrderStatusPill status={order.paymentStatus} kind="payment" />
          </div>
        </div>

        <OrderStatusControl orderId={order._id} current={order.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Customer</p>
          <p className="text-sm font-medium text-gray-800">
            {order.userId
              ? [order.userId.firstName, order.userId.lastName].filter(Boolean).join(' ')
              : 'Deleted account'}
          </p>
          <p className="text-sm text-gray-500 break-all">{order.email}</p>
          {order.userId?.phone && <p className="text-sm text-gray-500">{order.userId.phone}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ship to</p>
          <p className="text-sm font-medium text-gray-800">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
            {order.shippingAddress.phone}
          </p>
          <p className="text-xs text-gray-400 mt-2 capitalize">{order.shippingMethod} delivery</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment</p>
          <p className="text-sm text-gray-800 uppercase">{order.paymentMethod}</p>
          {order.payment?.razorpayPaymentId && (
            <p className="text-xs text-gray-500 font-mono break-all mt-1">
              {order.payment.razorpayPaymentId}
            </p>
          )}
          {order.payment?.paidAt && (
            <p className="text-xs text-gray-400 mt-1">Paid {when(order.payment.paidAt)}</p>
          )}
          {order.cancelReason && (
            <p className="text-xs text-red-600 mt-2">Cancelled: {order.cancelReason}</p>
          )}
          {order.returnReason && (
            <p className="text-xs text-orange-700 mt-2">Return: {order.returnReason}</p>
          )}
          {order.deliveredAt && (
            <p className="text-xs text-gray-400 mt-1">Delivered {when(order.deliveredAt)}</p>
          )}
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Ledger</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">State</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((entry) => (
                  <tr key={entry._id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-500 tabular-nums whitespace-nowrap">{when(entry.createdAt)}</td>
                    <td className="py-3 text-gray-800 capitalize">
                      {entry.kind} · {entry.method === 'cod' ? 'cash' : 'online'}
                    </td>
                    <td className="py-3 text-gray-400 font-mono text-xs break-all">
                      {entry.providerPaymentId || entry.note || '—'}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entry.status === 'success' ? 'bg-green-50 text-green-700'
                          : entry.status === 'failed' ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-medium tabular-nums ${
                      entry.kind === 'refund' ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {entry.kind === 'refund' ? '−' : ''}{rupees(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${item.productId}-${item.variantKey}`} className="border-b border-gray-50 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" width={40} height={40} className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <span className="w-10 h-10 rounded bg-gray-100 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <Link href={`/admin/products/edit/${item.productId}`} className="text-gray-800 hover:text-[#3b497e]">
                          {item.name}
                        </Link>
                        {item.variantLabel && <p className="text-xs text-gray-400">{item.variantLabel}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-gray-500 tabular-nums">{rupees(item.price)}</td>
                  <td className="py-3 text-right text-gray-500 tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right font-medium text-gray-800 tabular-nums">{rupees(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1.5 mt-5 pt-5 border-t border-gray-100 ml-auto max-w-xs">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="tabular-nums">{rupees(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="tabular-nums">{order.shippingFee ? rupees(order.shippingFee) : 'Free'}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span className="text-green-600 tabular-nums">-{rupees(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-800 pt-2 mt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="tabular-nums">{rupees(order.total)}</span>
          </div>
        </div>
      </div>

      {order.timeline?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">History</p>
          <ol className="flex flex-col gap-2">
            {order.timeline.map((entry, index) => (
              <li key={index} className="flex items-baseline gap-3 text-sm">
                <span className="text-gray-400 w-44 shrink-0 tabular-nums">{when(entry.at)}</span>
                <span className="text-gray-800 capitalize">
                  {String(entry.status).replace(/_/g, ' ')}{entry.note ? ` — ${entry.note}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
