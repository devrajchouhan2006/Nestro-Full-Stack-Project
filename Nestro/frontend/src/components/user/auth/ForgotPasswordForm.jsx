'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconMail } from '@tabler/icons-react'
import { forgotPasswordRequest } from '@/utils/api'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-3 text-[13px] text-[#1E1E1E] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim()) return toast.error('Enter your email')

    setSending(true)
    const data = await forgotPasswordRequest({ email: email.trim() })
    setSending(false)

    if (!data.success) return toast.error(data.message)
    setSent(true)
    toast.success('Check your inbox')
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F5EDE4] text-[#8B5E3C] flex items-center justify-center mx-auto">
          <IconMail size={22} stroke={1.6} />
        </div>
        <div>
          <p className="text-[15px] font-medium text-[#1E1E1E]">Check your email</p>
          <p className="text-[13px] text-[#6B7280] mt-1">
            If an account exists for {email}, a six-digit reset code is on its way.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)}
          className="text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
        >
          Enter the code
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium text-[#1E1E1E]">Forgot your password?</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Enter the email on your account and we will send you a reset code.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-[0.08em] text-[#6B7280]" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send reset code'}
      </button>

      <Link href="/auth" className="text-[12px] text-[#8B5E3C] hover:underline text-center">
        Back to sign in
      </Link>
    </form>
  )
}
