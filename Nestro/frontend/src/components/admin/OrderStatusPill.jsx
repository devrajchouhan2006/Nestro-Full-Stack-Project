// Admin-side twin of the storefront badge, in the panel's own visual language.
export const statusStyles = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700' },
  packed: { label: 'Packed', classes: 'bg-indigo-50 text-indigo-700' },
  dispatched: { label: 'Dispatched', classes: 'bg-violet-50 text-violet-700' },
  shipped: { label: 'Shipped', classes: 'bg-cyan-50 text-cyan-700' },
  out_for_delivery: { label: 'Out for delivery', classes: 'bg-sky-50 text-sky-700' },
  delivered: { label: 'Delivered', classes: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-600' },
  return_requested: { label: 'Return requested', classes: 'bg-orange-50 text-orange-700' },
  returned: { label: 'Returned', classes: 'bg-gray-100 text-gray-700' },
  refunded: { label: 'Refunded', classes: 'bg-gray-100 text-gray-600' },
}

export const paymentStyles = {
  pending: { label: 'Unpaid', classes: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', classes: 'bg-green-50 text-green-700' },
  failed: { label: 'Failed', classes: 'bg-red-50 text-red-600' },
  refunded: { label: 'Refunded', classes: 'bg-gray-100 text-gray-600' },
}

export default function OrderStatusPill({ status, kind = 'order' }) {
  const map = kind === 'payment' ? paymentStyles : statusStyles
  const config = map[status] || { label: status, classes: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.classes}`}>
      {config.label}
    </span>
  )
}
