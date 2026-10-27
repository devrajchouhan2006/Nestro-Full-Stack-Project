import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [], // { productId, name, image, price }
  hydrated: false,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const { productId } = action.payload
      const index = state.items.findIndex((item) => item.productId === productId)
      if (index >= 0) state.items.splice(index, 1)
      else state.items.push(action.payload)
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== action.payload)
    },
    clearWishlist: (state) => {
      state.items = []
    },
    hydrateWishlist: (state, action) => {
      state.items = action.payload || []
      state.hydrated = true
    },
  },
})

export const { toggleWishlist, removeFromWishlist, clearWishlist, hydrateWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
