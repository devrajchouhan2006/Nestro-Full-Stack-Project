'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { IconEye, IconEyeOff, IconAlertTriangle } from '@tabler/icons-react'
import { changePasswordRequest } from '@/utils/api'
import { logout } from '@/redux/slices/authSlice'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 pr-10 text-[13px] text-[#1E1E1E] bg-[#FAFAF9] outline-none focus:border-[#C6A27E] transition-colors'
const labelClass = 'text-[11px] uppercase tracking-[0.08em] text-[#6B7280]'

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? 'text' : 'password'}
        className={inputClass}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#8B5E3C]"
      >
        {shown ? <IconEyeOff size={16} stroke={1.7} /> : <IconEye size={16} stroke={1.7} />}
      </button>
    </div>
  )
}

export default function SettingsTab() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.newPassword.length < 8) return toast.error('Your new password must be at least 8 characters')
    if (form.newPassword !== form.confirmPassword) return toast.error('The two new passwords do not match')

    setSaving(true)
    const data = await changePasswordRequest({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success('Password updated')
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleSignOutEverywhere = async () => {
    await dispatch(logout())
    toast.success('Signed out')
    router.push('/auth')
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-[15px] font-medium text-[#1E1E1E]">Change password</h2>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Use at least 8 characters. A mix of words is easier to remember than symbols.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 max-w-sm">
          <label className={labelClass} htmlFor="currentPassword">Current password</label>
          <PasswordInput id="currentPassword" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="newPassword">New password</label>
            <PasswordInput id="newPassword" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="confirmPassword">Confirm new password</label>
            <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="self-start text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-3">
        <h2 className="text-[15px] font-medium text-[#1E1E1E]">Session</h2>
        <p className="text-[12px] text-[#6B7280] flex items-start gap-2 max-w-prose">
          <IconAlertTriangle size={15} stroke={1.7} className="text-[#96690A] flex-shrink-0 mt-0.5" />
          Signing out clears the cart and wishlist stored on this device. Your account keeps its own copy.
        </p>
        <button
          type="button"
          onClick={handleSignOutEverywhere}
          className="self-start text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium border border-[#E8E0D5] text-[#6B7280] hover:bg-[#F8F5F1]"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
