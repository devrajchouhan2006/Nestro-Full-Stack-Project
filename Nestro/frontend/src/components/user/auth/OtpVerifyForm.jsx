'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { verifyOtp, resendOtp } from '@/redux/slices/authSlice'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-[#FAFAF9] outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa] text-center tracking-[0.3em] font-medium'

export default function OtpVerifyForm() {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  // Where to land once the account is live (checkout, usually).
  const next = searchParams.get('next') || '/'

  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await dispatch(verifyOtp({ email, otp }))
    setSubmitting(false)

    if (verifyOtp.fulfilled.match(result)) {
      toast.success('Email verified — welcome to Nestro!')
      router.push(next)
      return
    }
    toast.error(result.payload?.message || 'Invalid OTP')
  }

  const handleResend = async () => {
    setResending(true)
    const result = await dispatch(resendOtp({ email }))
    setResending(false)

    if (resendOtp.fulfilled.match(result)) {
      toast.success('OTP resent to your email')
    } else {
      toast.error(result.payload?.message || 'Could not resend OTP')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-medium text-[#1E1E1E]">Verify your email</h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Enter the 6-digit code sent to {email ? <span className="font-medium text-[#1E1E1E]">{email}</span> : 'your email'}
        </p>
      </div>

      <div>
        <label className="block text-sm text-[#6B7280] mb-1">Verification Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          required
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || otp.length !== 6}
        className="w-full bg-[#8B5E3C] text-white text-[13px] tracking-[0.06em] uppercase font-medium py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Verifying…' : 'Verify'}
      </button>

      <p className="text-center text-xs text-[#6B7280]">
        Didn&apos;t get the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[#8B5E3C] hover:underline font-medium disabled:opacity-50"
        >
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </p>
    </form>
  )
}
