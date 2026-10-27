'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { IconLoader2 } from '@tabler/icons-react'
import Container from '@website/ui/Container'
import ProfileSidebar from '@website/profile/ProfileSidebar'
import OrdersTab from '@website/profile/OrdersTab'
import PersonalInfoTab from '@website/profile/PersonalInfoTab'
import AddressTab from '@website/profile/AddressTab'
import SettingsTab from '@website/profile/SettingsTab'

const tabLabels = {
  orders: 'My orders',
  personal: 'Personal info',
  address: 'Addresses',
  settings: 'Settings',
}

function ActiveTab({ tab, user }) {
  switch (tab) {
    // Keyed on the account id so switching users resets the form rather than
    // syncing it from an effect.
    case 'personal': return <PersonalInfoTab key={user?._id || 'anon'} user={user} />
    case 'address': return <AddressTab />
    case 'settings': return <SettingsTab />
    default: return <OrdersTab />
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('orders')
  const authStatus = useSelector((state) => state.auth.status)
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/auth?next=/profile')
  }, [authStatus, router])

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex items-center justify-center gap-2 py-24 text-[#6B7280] text-[13px]">
          <IconLoader2 size={16} className="animate-spin" /> Loading your account…
        </div>
      </Container>
    )
  }

  if (authStatus === 'unauthenticated') return null

  return (
    <Container className="mt-10 mb-20">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B5E3C] mb-1">Account</p>
        <h1 className="text-2xl md:text-3xl font-normal text-[#1E1E1E]">{tabLabels[activeTab]}</h1>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
        <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="min-w-0">
          <ActiveTab tab={activeTab} user={user} />
        </div>
      </div>
    </Container>
  )
}
