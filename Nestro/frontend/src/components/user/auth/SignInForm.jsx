'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { signin } from '@/redux/slices/authSlice'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-[#FAFAF9] outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]'
const labelClass = 'block text-sm text-[#6B7280] mb-1'

export default function SignInForm({ onSwitch }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Set when a protected page bounced the visitor here, so they land back
  // where they were trying to go.
  const next = searchParams.get('next') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await dispatch(signin(form))
    setSubmitting(false)

    if (signin.fulfilled.match(result)) {
      toast.success('Signed in successfully')
      router.push(next)
      return
    }

    const payload = result.payload
    if (payload?.notVerified) {
      toast.error('Please verify your email first')
      router.push(`/auth/otp-verify?email=${encodeURIComponent(payload.email)}&next=${encodeURIComponent(next)}`)
      return
    }
    toast.error(payload?.message || 'Sign in failed')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-medium text-[#1E1E1E]">Welcome back</h2>
        <p className="text-xs text-[#6B7280] mt-1">Sign in to your Nestro account</p>
      </div>

      <div>
        <label className={labelClass} htmlFor="signin-email">Email</label>
        <input
          id="signin-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@email.com"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-[#6B7280]" htmlFor="signin-password">Password</label>
          <Link href="/auth/forgot-password" className="text-sm text-[#8B5E3C] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
            autoComplete="current-password"
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#8B5E3C] transition-colors"
          >
            {showPassword ? <IconEyeOff size={16} stroke={1.8} /> : <IconEye size={16} stroke={1.8} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#8B5E3C] text-white text-[13px] tracking-[0.06em] uppercase font-medium py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-[#6B7280]">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-[#8B5E3C] hover:underline font-medium">
          Create one free
        </button>
      </p>
    </form>
  )
}
