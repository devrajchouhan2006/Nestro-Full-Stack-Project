import { createSlice } from '@reduxjs/toolkit'

// A line is a product *and* a variant: the same sofa in Walnut and in Ebony are
// two lines, so the key has to carry both.
export const lineKey = (productId, variantKey = '') => `${productId}::${variantKey || ''}`

const initialState = {
  items: [], // { productId, variantKey, variantLabel, name, slug, image, price, quantity, maxQty }
  hydrated: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { productId, variantKey = '', quantity = 1, maxQty } = action.payload
      const key = lineKey(productId, variantKey)
      const existing = state.items.find((item) => lineKey(item.productId, item.variantKey) === key)

      if (existing) {
        const ceiling = maxQty ?? existing.maxQty ?? 20
        existing.quantity = Math.min(existing.quantity + quantity, ceiling)
        // Price and stock can move between visits; the latest read wins.
        if (action.payload.price !== undefined) existing.price = action.payload.price
        if (maxQty !== undefined) existing.maxQty = maxQty
      } else {
        state.items.push({ variantKey: '', ...action.payload, quantity })
      }
    },
    removeFromCart: (state, action) => {
      const { productId, variantKey = '' } = typeof action.payload === 'string'
        ? { productId: action.payload }
        : action.payload
      const key = lineKey(productId, variantKey)
      state.items = state.items.filter((item) => lineKey(item.productId, item.variantKey) !== key)
    },
    updateQuantity: (state, action) => {
      const { productId, variantKey = '', quantity } = action.payload
      const key = lineKey(productId, variantKey)
      const item = state.items.find((line) => lineKey(line.productId, line.variantKey) === key)
      if (item) item.quantity = Math.min(Math.max(1, quantity), item.maxQty ?? 20)
    },
    clearCart: (state) => {
      state.items = []
    },
    hydrateCart: (state, action) => {
      state.items = action.payload || []
      state.hydrated = true
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, hydrateCart } = cartSlice.actions

/* selectors */
export const selectCartItems = (state) => state.cart.items
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

export default cartSlice.reducer
