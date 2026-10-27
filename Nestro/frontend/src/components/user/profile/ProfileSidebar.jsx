'use client'

import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  IconShoppingBag, IconUser, IconMapPin, IconSettings, IconLogout,
} from '@tabler/icons-react'
import { logout } from '@/redux/slices/authSlice'
import { clearCart } from '@/redux/slices/cartSlice'
import { clearWishlist } from '@/redux/slices/wishlistSlice'

const navItems = [
  { tab: 'orders', Icon: IconShoppingBag, label: 'My orders' },
  { tab: 'personal', Icon: IconUser, label: 'Personal info' },
  { tab: 'address', Icon: IconMapPin, label: 'Addresses' },
  { tab: 'settings', Icon: IconSettings, label: 'Settings' },
]

const initials = (user) =>
  [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'N'

export default function ProfileSidebar({ activeTab, setActiveTab }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  const handleSignOut = async () => {
    await dispatch(logout())
    // Clearing here stops the next visitor on a shared computer inheriting the
    // basket that was just synced to the account.
    dispatch(clearCart())
    dispatch(clearWishlist())
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <aside className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-6 h-fit">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-[72px] h-[72px] rounded-full bg-[#8B5E3C] flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-medium text-white">{initials(user)}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <p className="text-[15px] font-medium text-[#1E1E1E] truncate">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your account'}
          </p>
          <p className="text-[12px] text-[#6B7280] truncate">{user?.email}</p>
        </div>
      </div>

      <div className="border-t border-[#E8E0D5]" />

      <nav className="flex flex-col gap-1">
        {navItems.map(({ tab, Icon, label }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors text-left w-full ${
              activeTab === tab
                ? 'bg-[#F5EDE4] text-[#8B5E3C] font-medium'
                : 'text-[#6B7280] hover:bg-[#F8F5F1] hover:text-[#1E1E1E]'
            }`}
          >
            <Icon size={16} stroke={1.8} className="flex-shrink-0" />
            {label}
          </button>
        ))}

        <div className="border-t border-[#E8E0D5] my-1" />

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
        >
          <IconLogout size={16} stroke={1.8} className="flex-shrink-0" />
          Sign out
        </button>
      </nav>
    </aside>
  )
}
