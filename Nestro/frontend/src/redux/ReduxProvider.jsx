'use client'

import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from './store'
import { hydrateCart, lineKey } from './slices/cartSlice'
import { hydrateWishlist } from './slices/wishlistSlice'
import { fetchMe } from './slices/authSlice'
import {
  fetchServerCart, syncServerCart,
  fetchServerWishlist, syncServerWishlist,
} from '@/utils/api'

const CART_KEY = 'nestro_cart'
const WISHLIST_KEY = 'nestro_wishlist'
// Which account this device's local basket has already been folded into.
const MERGED_KEY = 'nestro_merged_for'

const readLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or a full quota: the server copy is the durable one anyway.
  }
}

const readString = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeString = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode or a full quota — see writeLocal.
  }
}

// Signing in should never lose what a guest already put in their basket, so the
// local and server carts are merged rather than one overwriting the other.
//
// That merge is a ONE-TIME event, on the first boot after signing in on this
// device. Afterwards the account's cart is the authority, because the union can
// only ever grow: once an order clears the cart server-side, a stale local copy
// would put every purchased item straight back — which is exactly what happened
// when a shopper found their basket full again after paying.
const mergeCarts = (local, server) => {
  const byKey = new Map()
  for (const line of [...server, ...local]) {
    const key = lineKey(line.productId, line.variantKey)
    const existing = byKey.get(key)
    if (existing) existing.quantity = Math.max(existing.quantity, line.quantity)
    else byKey.set(key, { ...line })
  }
  return [...byKey.values()]
}

const mergeWishlists = (local, server) => {
  const byId = new Map()
  for (const item of [...server, ...local]) byId.set(item.productId, item)
  return [...byId.values()]
}

export default function ReduxProvider({ children }) {
  // Lazy initialiser: makeStore() runs once, on the first render, and never
  // again — without reaching into a ref mid-render.
  const [store] = useState(makeStore)

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      const localCart = readLocal(CART_KEY)
      const localWishlist = readLocal(WISHLIST_KEY)

      // Show the local copy immediately so the header badge is never empty on
      // first paint, then reconcile with the account once /me answers.
      store.dispatch(hydrateCart(localCart))
      store.dispatch(hydrateWishlist(localWishlist))

      const result = await store.dispatch(fetchMe())
      if (cancelled) return

      if (fetchMe.fulfilled.match(result)) {
        const [cartRes, wishRes] = await Promise.all([fetchServerCart(), fetchServerWishlist()])
        if (cancelled) return

        const userId = String(result.payload?.user?._id || result.payload?._id || '')
        const alreadyMerged = userId && readString(MERGED_KEY) === userId

        const serverCart = cartRes.success ? cartRes.items : []
        const serverWishlist = wishRes.success ? wishRes.items : []

        // Re-read rather than trusting the snapshot taken before these awaits:
        // the shopper may have changed the basket while /me was in flight.
        const freshLocalCart = readLocal(CART_KEY)
        const freshLocalWishlist = readLocal(WISHLIST_KEY)

        const nextCart = alreadyMerged ? serverCart : mergeCarts(freshLocalCart, serverCart)
        const nextWishlist = alreadyMerged
          ? serverWishlist
          : mergeWishlists(freshLocalWishlist, serverWishlist)

        store.dispatch(hydrateCart(nextCart))
        store.dispatch(hydrateWishlist(nextWishlist))

        if (!alreadyMerged) {
          // Push the one-time merge back so the other device sees it too, and
          // record that this device has handed its guest basket over.
          syncServerCart(nextCart.map(({ productId, variantKey, quantity }) => ({
            productId, variantKey: variantKey || '', quantity,
          })))
          syncServerWishlist(nextWishlist.map((item) => item.productId))
          if (userId) writeString(MERGED_KEY, userId)
        }
      }
    }

    boot()

    let previousCart = store.getState().cart.items
    let previousWishlist = store.getState().wishlist.items
    let previousUser = store.getState().auth.user
    let timer = null

    const unsubscribe = store.subscribe(() => {
      const state = store.getState()

      // Signing out hands the basket back to the guest on this device, so the
      // next account that signs in here gets a fresh merge rather than being
      // treated as already reconciled.
      if (previousUser && !state.auth.user) {
        try { localStorage.removeItem(MERGED_KEY) } catch { /* see writeLocal */ }
      }
      previousUser = state.auth.user

      const cartChanged = state.cart.items !== previousCart
      const wishChanged = state.wishlist.items !== previousWishlist
      if (!cartChanged && !wishChanged) return

      if (cartChanged) {
        previousCart = state.cart.items
        writeLocal(CART_KEY, state.cart.items)
      }
      if (wishChanged) {
        previousWishlist = state.wishlist.items
        writeLocal(WISHLIST_KEY, state.wishlist.items)
      }

      // Debounced: a shopper tapping "+" five times should cost one request.
      if (!state.auth.user) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const now = store.getState()
        if (cartChanged) {
          syncServerCart(now.cart.items.map(({ productId, variantKey, quantity }) => ({
            productId, variantKey: variantKey || '', quantity,
          })))
        }
        if (wishChanged) {
          syncServerWishlist(now.wishlist.items.map((item) => item.productId))
        }
      }, 700)
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Provider store={store}>{children}</Provider>
}
