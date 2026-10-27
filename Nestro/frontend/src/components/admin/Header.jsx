'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MdLogout } from 'react-icons/md'
import { fetchMeRequest, logoutRequest } from '@/utils/api'

// Turns /admin/products/edit/abc into "Products".
const titleFor = (pathname) => {
  const segment = pathname.split('/')[2]
  if (!segment) return 'Dashboard'
  return segment
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    let alive = true
    fetchMeRequest().then((data) => {
      if (alive && data.success) setUser(data.user)
    })
    return () => { alive = false }
  }, [])

  const handleLogout = async () => {
    await logoutRequest()
    toast.success('Signed out')
    window.location.href = '/admin-login'
  }

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">{titleFor(pathname)}</h1>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-gray-800">
              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
            </span>
            <span className="text-[11px] text-gray-400">{user.email}</span>
          </div>
        )}
        <div className="w-9 h-9 rounded-full bg-[#3b497e] text-white flex items-center justify-center text-sm font-medium">
          {(user?.firstName?.[0] || 'A').toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
        >
          <MdLogout className="text-xl" />
        </button>
      </div>
    </header>
  )
}
