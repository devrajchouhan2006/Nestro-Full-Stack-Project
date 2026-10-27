'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/utils/api'

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3b497e] transition'
const labelClass = 'text-xs font-medium text-gray-600'

const blank = {
  code: '',
  type: 'percent',
  value: '',
  maxDiscount: '',
  minOrderValue: '',
  usageLimit: '',
  expiresAt: '',
  status: true,
}

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await fetchCoupons()
    if (data.success) setCoupons(data.coupons)
    else toast.error(data.message)
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    fetchCoupons().then((data) => {
      if (!alive) return
      if (data.success) setCoupons(data.coupons)
      else toast.error(data.message)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.code.trim().length < 3) return toast.error('A code needs at least 3 characters')
    if (!form.value) return toast.error('Set a discount value')
    if (form.type === 'percent' && Number(form.value) > 100) {
      return toast.error('A percentage cannot be above 100')
    }

    setSaving(true)
    const payload = {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value),
      // Empty optional numbers must go as null, not "", so the schema treats
      // them as "no cap" rather than zero.
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiresAt: form.expiresAt || null,
      status: true,
    }
    const data = await createCoupon(payload)
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success('Coupon created')
    setForm(blank)
    setShowForm(false)
    load()
  }

  const toggle = async (coupon) => {
    const data = await updateCoupon(coupon._id, { status: !coupon.status })
    if (!data.success) return toast.error(data.message)
    load()
  }

  const remove = async (coupon) => {
    if (!window.confirm(`Delete ${coupon.code}? Orders that already used it are unaffected.`)) return
    const data = await deleteCoupon(coupon._id)
    if (!data.success) return toast.error(data.message)
    toast.success('Coupon removed')
    load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="bg-[#3b497e] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2f3b69] text-sm font-medium transition"
        >
          <FiPlus size={15} /> {showForm ? 'Close' : 'New coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 grid md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="code">Code</label>
            <input
              id="code"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="NESTRO15"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="type">Type</label>
            <select id="type" value={form.type} onChange={set('type')} className={`${inputClass} cursor-pointer`}>
              <option value="percent">Percentage off</option>
              <option value="flat">Flat rupees off</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="value">
              {form.type === 'percent' ? 'Percent off' : 'Rupees off'}
            </label>
            <input id="value" type="number" min="0" value={form.value} onChange={set('value')} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="maxDiscount">Max discount (₹)</label>
            <input
              id="maxDiscount"
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={set('maxDiscount')}
              disabled={form.type === 'flat'}
              placeholder="No cap"
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="minOrderValue">Minimum order (₹)</label>
            <input id="minOrderValue" type="number" min="0" value={form.minOrderValue} onChange={set('minOrderValue')} placeholder="0" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="usageLimit">Total uses</label>
            <input id="usageLimit" type="number" min="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="expiresAt">Expires</label>
            <input id="expiresAt" type="date" value={form.expiresAt} onChange={set('expiresAt')} className={inputClass} />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#3b497e] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#2f3b69] transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">
            No coupons yet. Create one and it becomes usable at checkout immediately.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Discount</th>
                  <th className="p-3 font-medium">Minimum</th>
                  <th className="p-3 font-medium">Used</th>
                  <th className="p-3 font-medium">Expires</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                  return (
                    <tr key={coupon._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="p-3 font-mono font-medium text-gray-800">{coupon.code}</td>
                      <td className="p-3 text-gray-600 tabular-nums">
                        {coupon.type === 'percent'
                          ? `${coupon.value}%${coupon.maxDiscount ? ` (max ${rupees(coupon.maxDiscount)})` : ''}`
                          : rupees(coupon.value)}
                      </td>
                      <td className="p-3 text-gray-600 tabular-nums">
                        {coupon.minOrderValue ? rupees(coupon.minOrderValue) : '—'}
                      </td>
                      <td className="p-3 text-gray-600 tabular-nums">
                        {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </td>
                      <td className={`p-3 tabular-nums ${expired ? 'text-red-600' : 'text-gray-600'}`}>
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Never'}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => toggle(coupon)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            coupon.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {coupon.status ? 'Active' : 'Paused'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(coupon)}
                          aria-label={`Delete ${coupon.code}`}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
