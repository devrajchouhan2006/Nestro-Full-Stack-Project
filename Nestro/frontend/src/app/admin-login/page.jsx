'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { IconLock, IconEye, IconEyeOff } from '@tabler/icons-react'
import { adminSigninRequest } from '@/utils/api'

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white outline-none focus:border-[#3b497e] focus:ring-2 focus:ring-[#3b497e]/15 transition'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/admin'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    const data = await adminSigninRequest(form)
    setSubmitting(false)

    if (!data.success) return toast.error(data.message)
    toast.success('Welcome back')
    // A full navigation so middleware sees the freshly set cookie.
    window.location.href = next
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-11 h-11 rounded-xl bg-[#3b497e]/10 text-[#3b497e] flex items-center justify-center">
          <IconLock size={20} stroke={1.7} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nestro admin</h1>
          <p className="text-xs text-gray-500 mt-0.5">Staff accounts only</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600" htmlFor="admin-email">Email</label>
        <input id="admin-email" type="email" required className={inputClass} value={form.email} onChange={set('email')} autoComplete="email" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600" htmlFor="admin-password">Password</label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            required
            className={`${inputClass} pr-10`}
            value={form.password}
            onChange={set('password')}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <IconEyeOff size={16} stroke={1.7} /> : <IconEye size={16} stroke={1.7} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#3b497e] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2f3b69] transition disabled:opacity-50"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        No admin account yet? Create one on the server with
        <code className="mx-1 px-1 py-0.5 bg-gray-50 rounded text-gray-600">npm run seed:admin</code>
      </p>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Toaster position="top-right" richColors />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
