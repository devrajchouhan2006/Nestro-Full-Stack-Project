'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { IconCircleCheck } from '@tabler/icons-react'
import { sendEnquiry } from '@/utils/api'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]'
const labelClass = 'text-[11px] uppercase tracking-[0.08em] text-[#6B7280]'

const blank = { name: '', email: '', subject: '', message: '' }

export default function ContactForm() {
  const [form, setForm] = useState(blank)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.name.trim().length < 2) return toast.error('Please tell us your name')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return toast.error('Enter a valid email address')
    if (form.message.trim().length < 10) return toast.error('Please add a little more detail')

    setSending(true)
    const data = await sendEnquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    })
    setSending(false)

    if (!data.success) return toast.error(data.message)
    setForm(blank)
    setSent(true)
    toast.success(data.message)
  }

  if (sent) {
    return (
      <div className="bg-white border border-[#E8E0D5] rounded-xl p-8 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
          <IconCircleCheck size={24} stroke={1.6} />
        </div>
        <p className="text-[15px] font-medium text-[#1E1E1E]">Message sent</p>
        <p className="text-[13px] text-[#6B7280]">We reply within one business day.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[12px] text-[#8B5E3C] hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="contact-name">Your name</label>
          <input id="contact-name" className={inputClass} value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="contact-email">Email</label>
          <input id="contact-email" type="email" className={inputClass} value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="contact-subject">Subject</label>
        <select id="contact-subject" className={`${inputClass} cursor-pointer`} value={form.subject} onChange={set('subject')}>
          <option value="">General enquiry</option>
          <option value="Order support">Order support</option>
          <option value="Delivery and assembly">Delivery and assembly</option>
          <option value="Returns">Returns</option>
          <option value="Trade and bulk">Trade and bulk</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          rows={5}
          className={`${inputClass} resize-y`}
          value={form.message}
          onChange={set('message')}
          placeholder="How can we help?"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="self-start text-[11px] tracking-[0.08em] uppercase px-6 py-3 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
