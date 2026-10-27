'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { resetPasswordRequest } from '@/utils/api'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-3 text-[13px] text-[#1E1E1E] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]'
const labelClass = 'text-[11px] uppercase tracking-[0.08em] text-[#6B7280]'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: '',
    password: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!/^[0-9]{6}$/.test(form.code.trim())) return toast.error('Enter the six-digit code from your email')
    if (form.password.length < 8) return toast.error('Your new password must be at least 8 characters')
    if (form.password !== form.confirm) return toast.error('The two passwords do not match')

    setSaving(true)
    const data = await resetPasswordRequest({
      email: form.email.trim(),
      code: form.code.trim(),
      password: form.password,
    })
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success('Password updated — please sign in')
    router.push('/auth')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium text-[#1E1E1E]">Choose a new password</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Enter the code we emailed you along with your new password.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="reset-email">Email</label>
        <input id="reset-email" type="email" className={inputClass} value={form.email} onChange={set('email')} autoComplete="email" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="reset-code">Reset code</label>
        <input
          id="reset-code"
          className={`${inputClass} tracking-[0.4em] text-center font-mono`}
          value={form.code}
          onChange={set('code')}
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="reset-password">New password</label>
        <input id="reset-password" type="password" className={inputClass} value={form.password} onChange={set('password')} autoComplete="new-password" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="reset-confirm">Confirm new password</label>
        <input id="reset-confirm" type="password" className={inputClass} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Updating…' : 'Update password'}
      </button>

      <Link href="/auth/forgot-password" className="text-[12px] text-[#8B5E3C] hover:underline text-center">
        Send a new code
      </Link>
    </form>
  )
}
