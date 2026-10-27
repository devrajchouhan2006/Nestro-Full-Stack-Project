import {
  IconCircleCheck, IconTruckDelivery, IconClock, IconCircleX,
  IconPackage, IconRotateClockwise, IconBuildingWarehouse, IconMapPin,
  IconArrowBackUp,
} from '@tabler/icons-react'

// One source of truth for how an order status looks, used by the account page,
// the order detail page and the admin table.
export const statusConfig = {
  pending: { label: 'Payment pending', classes: 'bg-amber-50 text-amber-700', Icon: IconClock },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700', Icon: IconCircleCheck },
  packed: { label: 'Packed', classes: 'bg-indigo-50 text-indigo-700', Icon: IconPackage },
  dispatched: { label: 'Dispatched', classes: 'bg-violet-50 text-violet-700', Icon: IconBuildingWarehouse },
  shipped: { label: 'In transit', classes: 'bg-cyan-50 text-cyan-700', Icon: IconTruckDelivery },
  out_for_delivery: { label: 'Out for delivery', classes: 'bg-amber-50 text-amber-700', Icon: IconMapPin },
  delivered: { label: 'Delivered', classes: 'bg-green-50 text-green-700', Icon: IconCircleCheck },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-600', Icon: IconCircleX },
  return_requested: { label: 'Return requested', classes: 'bg-orange-50 text-orange-700', Icon: IconArrowBackUp },
  returned: { label: 'Returned', classes: 'bg-gray-100 text-gray-700', Icon: IconArrowBackUp },
  refunded: { label: 'Refunded', classes: 'bg-gray-100 text-gray-600', Icon: IconRotateClockwise },
}

// The happy path only. Cancellations and returns are exits from it, not steps
// along it, so the progress rail hides itself for those.
export const STATUS_FLOW = [
  'confirmed', 'packed', 'dispatched', 'shipped', 'out_for_delivery', 'delivered',
]

// Statuses that mean the order has left the happy path.
export const DERAILED = new Set(['cancelled', 'return_requested', 'returned', 'refunded'])

// How long after delivery a return can still be asked for — mirrors
// RETURN_WINDOW_DAYS on the server, which is the one that actually enforces it.
export const RETURN_WINDOW_DAYS = 7

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  const { Icon } = config
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${config.classes}`}>
      <Icon size={13} stroke={1.8} />
      {config.label}
    </span>
  )
}
