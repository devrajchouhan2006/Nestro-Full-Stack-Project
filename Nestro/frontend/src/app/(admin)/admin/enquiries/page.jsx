'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchAdminEnquiries, updateEnquiryStatus } from '@/utils/api'

const TABS = [
  { key: '', label: 'All' },
  { key: 'enquiry', label: 'Messages' },
  { key: 'newsletter', label: 'Newsletter' },
]

const STATUS_TONE = {
  new: 'bg-blue-50 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-50 text-green-700',
  archived: 'bg-gray-100 text-gray-400',
}

const when = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export default function AdminEnquiriesPage() {
  const [kind, setKind] = useState('')
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [state, setState] = useState('loading')

  // `reload` is a counter rather than a function call so that marking a status
  // and switching tabs both re-run this one effect. State is only set from the
  // promise callback, never synchronously while the effect body runs.
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    fetchAdminEnquiries(kind ? { kind } : {}).then((data) => {
      if (!alive) return
      if (!data.success) return setState('error')
      setItems(data.items)
      setUnread(data.unread)
      setState('ready')
    })
    return () => { alive = false }
  }, [kind, reload])

  const switchTo = (which) => {
    if (which === kind) return
    setState('loading')
    setKind(which)
  }

  const setStatus = async (id, status) => {
    const data = await updateEnquiryStatus(id, status)
    if (!data.success) return toast.error(data.message)
    // Patch in place rather than refetching — the list does not move under the
    // person who just clicked.
    setItems((prev) => prev.map((row) => (row._id === id ? { ...row, status } : row)))
    setUnread((prev) => (status !== 'new' ? Math.max(0, prev - 1) : prev + 1))
    // Archiving removes the row from a filtered view, so pull the list again.
    if (status === 'archived') setReload((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Enquiries</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Everything the contact form and newsletter box collected. Saved here whether or not the
          forwarding email went out{unread > 0 ? ` — ${unread} still unanswered.` : '.'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key || 'all'}
            type="button"
            onClick={() => switchTo(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${
              kind === tab.key ? 'bg-[#3b497e] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state === 'loading' && (
        <p className="text-sm text-gray-400 py-10 text-center">Loading…</p>
      )}

      {state === 'error' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">Could not load enquiries.</p>
        </div>
      )}

      {state === 'ready' && items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">Nothing here yet.</p>
        </div>
      )}

      {state === 'ready' && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((row) => (
            <article key={row._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {row.kind === 'newsletter' ? 'Newsletter signup' : (row.subject || 'General')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 break-all">
                    {row.name ? `${row.name} · ` : ''}
                    <a href={`mailto:${row.email}`} className="text-[#3b497e] hover:underline">{row.email}</a>
                    {' · '}{when(row.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!row.emailed && row.kind === 'enquiry' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      not emailed
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_TONE[row.status]}`}>
                    {row.status}
                  </span>
                </div>
              </div>

              {row.message && (
                <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{row.message}</p>
              )}

              {row.kind === 'enquiry' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  {['read', 'replied', 'archived'].map((next) => (
                    <button
                      key={next}
                      type="button"
                      disabled={row.status === next}
                      onClick={() => setStatus(row._id, next)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed capitalize"
                    >
                      Mark {next}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
