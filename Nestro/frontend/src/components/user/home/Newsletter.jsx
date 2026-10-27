'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { IconMail } from '@tabler/icons-react'
import { subscribeNewsletter } from '@/utils/api'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error('Enter a valid email address')

    setSending(true)
    const data = await subscribeNewsletter(email.trim())
    setSending(false)

    if (!data.success) return toast.error(data.message)
    setDone(true)
    setEmail('')
    toast.success('You are on the list')
  }

  return (
    <section className="bg-[#2C2016] rounded-2xl px-6 py-12 md:px-12 md:py-14 text-center flex flex-col items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-[#C6A27E]/15 text-[#D6BFA7] flex items-center justify-center">
        <IconMail size={20} stroke={1.6} />
      </div>

      <div className="max-w-md">
        <h2 className="text-2xl font-normal text-white leading-tight text-balance">
          New pieces, first look
        </h2>
        <p className="text-[13px] text-white/50 mt-2 leading-relaxed">
          One email a month: new arrivals, restocks, and the occasional workshop story. No noise.
        </p>
      </div>

      {done ? (
        <p className="text-[13px] text-[#D6BFA7]">Thanks — watch your inbox.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <label className="sr-only" htmlFor="newsletter-email">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 min-w-0 rounded-md px-4 py-3 text-[13px] bg-white/10 text-white placeholder-white/40 border border-white/15 outline-none focus:border-[#C6A27E] transition-colors"
          />
          <button
            type="submit"
            disabled={sending}
            className="text-[11px] tracking-[0.08em] uppercase px-6 py-3 rounded-md font-medium bg-[#C6A27E] text-[#2C2016] hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            {sending ? 'Signing up…' : 'Subscribe'}
          </button>
        </form>
      )}
    </section>
  )
}
