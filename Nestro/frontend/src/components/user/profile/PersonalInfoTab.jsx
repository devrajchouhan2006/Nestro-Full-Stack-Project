'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { IconCircleCheck } from '@tabler/icons-react'
import { updateProfile } from '@/redux/slices/authSlice'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-[#FAFAF9] outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa] disabled:opacity-60'
const labelClass = 'text-[11px] uppercase tracking-[0.08em] text-[#6B7280]'

// A stored date arrives as an ISO string; the date input wants YYYY-MM-DD.
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function PersonalInfoTab({ user }) {
  const dispatch = useDispatch()

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dob: toDateInput(user?.dob),
    gender: user?.gender || '',
  }))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.firstName.trim().length < 1) return toast.error('Your first name is required')

    setSaving(true)
    const result = await dispatch(updateProfile(form))
    setSaving(false)

    if (updateProfile.rejected.match(result)) {
      return toast.error(result.payload?.message || 'Could not save your details')
    }
    toast.success('Profile updated')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="firstName">First name</label>
          <input id="firstName" className={inputClass} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="lastName">Last name</label>
          <input id="lastName" className={inputClass} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="email">Email</label>
        <input id="email" className={inputClass} value={user?.email || ''} disabled />
        <span className="text-[11px] text-[#6B7280]">
          Your email is how you sign in, so it cannot be changed here.
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="phone">Phone</label>
          <input id="phone" className={inputClass} value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="dob">Date of birth</label>
          <input id="dob" type="date" className={inputClass} value={form.dob} onChange={set('dob')} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-2">
        <label className={labelClass} htmlFor="gender">Gender</label>
        <select id="gender" className={`${inputClass} cursor-pointer`} value={form.gender} onChange={set('gender')}>
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[12px] text-green-700">
            <IconCircleCheck size={14} stroke={2} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
