'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/utils/api'
import { statusStyles } from './OrderStatusPill'

// Grouped so the fulfilment path reads in order and the exits sit apart from
// it — picking "returned" should feel deliberate, not adjacent to "packed".
const GROUPS = [
  { label: 'Fulfilment', options: ['pending', 'confirmed', 'packed', 'dispatched', 'shipped', 'out_for_delivery', 'delivered'] },
  { label: 'Returns & exits', options: ['return_requested', 'returned', 'cancelled', 'refunded'] },
]

// Each of these puts the stock back on the shelf and, if the order was paid,
// writes a refund into the ledger — worth an explicit confirmation rather than
// a one-click accident.
const NEEDS_CONFIRM = new Set(['cancelled', 'returned', 'refunded'])

export default function OrderStatusControl({ orderId, current }) {
  const router = useRouter()
  const [status, setStatus] = useState(current)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (status === current) return toast.message('That is already the current status')

    if (NEEDS_CONFIRM.has(status)) {
      const ok = window.confirm(
        `Mark this order "${statusStyles[status]?.label || status}"?\n\n`
        + 'Stock goes back to inventory, and if the order was paid a refund is written to the ledger.'
      )
      if (!ok) return
    }

    setSaving(true)
    const data = await updateOrderStatus(orderId, { status, note: note.trim() })
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success(data.message)
    setNote('')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[280px]">
      <label className="text-xs font-medium text-gray-500" htmlFor="order-status">
        Update status
      </label>
      <div className="flex gap-2">
        <select
          id="order-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3b497e] transition cursor-pointer"
        >
          {GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option} value={option}>
                  {statusStyles[option]?.label || option}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || status === current}
          className="bg-[#3b497e] text-white text-sm font-medium px-4 rounded-lg hover:bg-[#2f3b69] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {saving ? 'Saving…' : 'Apply'}
        </button>
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note for the history (optional)"
        maxLength={300}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3b497e] transition"
      />
    </div>
  )
}
