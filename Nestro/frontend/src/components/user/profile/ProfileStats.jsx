'use client'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchAccountStats } from '@/utils/api'
import { formatPrice } from '@/utils/helper'

// Compact rupee figures: ₹4.2L reads better than ₹4,20,000 in a stat tile.
const compactRupees = (value) => {
  if (!value) return '₹0'
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return formatPrice(value)
}

export default function ProfileStats() {
  const wishlistCount = useSelector((state) => state.wishlist.items.length)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    fetchAccountStats().then((data) => {
      if (alive && data.success) setStats(data.stats)
    })
    return () => { alive = false }
  }, [])

  const tiles = [
    { value: stats ? String(stats.orders) : '—', label: 'Total orders' },
    { value: stats ? compactRupees(stats.spent) : '—', label: 'Total spent' },
    { value: String(wishlistCount), label: 'Wishlist items' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-[#F8F5F1] rounded-lg p-4 text-center flex flex-col gap-1">
          <p className="text-xl font-medium text-[#8B5E3C] tabular-nums">{tile.value}</p>
          <p className="text-xs text-[#6B7280]">{tile.label}</p>
        </div>
      ))}
    </div>
  )
}
