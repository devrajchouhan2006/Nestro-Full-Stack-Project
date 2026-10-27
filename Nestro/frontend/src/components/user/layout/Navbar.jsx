'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  IconSearch, IconShoppingBag, IconHeart, IconUser, IconMenu2, IconX, IconLogout,
} from '@tabler/icons-react'
import SearchBar from './SearchBar'
import { logout } from '@/redux/slices/authSlice'
import { clearCart, selectCartCount } from '@/redux/slices/cartSlice'
import { clearWishlist } from '@/redux/slices/wishlistSlice'

// Checkout is reached from the cart, not from the top nav — it was only in the
// header so the static mockup could be previewed.
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Store', href: '/store' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const iconBtn =
  'relative w-9 h-9 rounded-full flex items-center justify-center text-[#444444] hover:bg-[#F0EBE3] transition-all'

function CountBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#8B5E3C] text-white text-[10px] rounded-full flex items-center justify-center leading-none tabular-nums">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const cartCount = useSelector(selectCartCount)
  const wishlistCount = useSelector((state) => state.wishlist.items.length)
  const user = useSelector((state) => state.auth.user)

  const handleLogout = async () => {
    await dispatch(logout())
    dispatch(clearCart())
    dispatch(clearWishlist())
    setMenuOpen(false)
    toast.success('Signed out successfully')
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-[300] bg-[#FAFAF9]/95 backdrop-blur-md border-b border-[#E8E0D5]">
      <div className="h-[58px] flex items-center justify-between px-4 md:px-8 gap-4">
        <Link href="/" className="text-[16px] font-medium tracking-[0.12em] uppercase text-[#1E1E1E] flex-shrink-0">
          NESTRO<span className="text-[#8B5E3C]">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`text-[11px] tracking-[0.06em] rounded-md px-3 py-1.5 transition-colors ${
                pathname === link.href
                  ? 'bg-[#F0EBE3] text-[#8B5E3C]'
                  : 'text-[#6B7280] hover:bg-[#F0EBE3] hover:text-[#8B5E3C]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className={iconBtn}
          >
            <IconSearch size={18} stroke={1.7} />
          </button>

          <Link href="/wishlist" aria-label="Wishlist" className={iconBtn}>
            <IconHeart size={18} stroke={1.7} />
            <CountBadge count={wishlistCount} />
          </Link>

          <Link href="/cart" aria-label="Cart" className={iconBtn}>
            <IconShoppingBag size={18} stroke={1.7} />
            <CountBadge count={cartCount} />
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <Link href="/profile" className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-full hover:bg-[#F0EBE3] transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white text-[10px] flex items-center justify-center">
                  {(user.firstName?.[0] || 'N').toUpperCase()}
                </span>
                <span className="text-[11px] text-[#444444] max-w-[80px] truncate">{user.firstName}</span>
              </Link>
              <button type="button" onClick={handleLogout} aria-label="Sign out" className={iconBtn}>
                <IconLogout size={17} stroke={1.7} />
              </button>
            </div>
          ) : (
            <Link href="/auth" aria-label="Sign in" className={iconBtn}>
              <IconUser size={18} stroke={1.7} />
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Search" className={iconBtn}>
            <IconSearch size={18} stroke={1.7} />
          </button>
          <Link href="/cart" aria-label="Cart" className={iconBtn}>
            <IconShoppingBag size={18} stroke={1.7} />
            <CountBadge count={cartCount} />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={iconBtn}
          >
            {menuOpen ? <IconX size={19} stroke={1.7} /> : <IconMenu2 size={19} stroke={1.7} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#E8E0D5] bg-[#FAFAF9] px-4 md:px-8 py-3">
          <div className="max-w-2xl mx-auto">
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {menuOpen && (
        <nav className="md:hidden border-t border-[#E8E0D5] bg-[#FAFAF9] px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-[13px] rounded-md px-3 py-2.5 transition-colors ${
                pathname === link.href ? 'bg-[#F0EBE3] text-[#8B5E3C]' : 'text-[#6B7280] hover:bg-[#F0EBE3]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-[#E8E0D5] my-1" />

          <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="text-[13px] rounded-md px-3 py-2.5 text-[#6B7280] hover:bg-[#F0EBE3]">
            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>

          {user ? (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-[13px] rounded-md px-3 py-2.5 text-[#6B7280] hover:bg-[#F0EBE3]">
                My account
              </Link>
              <button type="button" onClick={handleLogout} className="text-[13px] rounded-md px-3 py-2.5 text-left text-red-600 hover:bg-red-50">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="text-[13px] rounded-md px-3 py-2.5 text-[#6B7280] hover:bg-[#F0EBE3]">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
