import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  signupRequest,
  verifyOtpRequest,
  resendOtpRequest,
  signinRequest,
  logoutRequest,
  fetchMeRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  updateProfileRequest,
} from '@/utils/api'

const handle = async (request, payload, rejectWithValue) => {
  const data = await request(payload)
  if (!data.success) return rejectWithValue(data)
  return data
}

export const signup = createAsyncThunk('auth/signup', async (payload, { rejectWithValue }) =>
  handle(signupRequest, payload, rejectWithValue)
)
export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload, { rejectWithValue }) =>
  handle(verifyOtpRequest, payload, rejectWithValue)
)
export const resendOtp = createAsyncThunk('auth/resendOtp', async (payload, { rejectWithValue }) =>
  handle(resendOtpRequest, payload, rejectWithValue)
)
export const signin = createAsyncThunk('auth/signin', async (payload, { rejectWithValue }) =>
  handle(signinRequest, payload, rejectWithValue)
)
export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload, { rejectWithValue }) =>
  handle(forgotPasswordRequest, payload, rejectWithValue)
)
export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload, { rejectWithValue }) =>
  handle(resetPasswordRequest, payload, rejectWithValue)
)
export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) =>
  handle(updateProfileRequest, payload, rejectWithValue)
)
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) =>
  handle(logoutRequest, undefined, rejectWithValue)
)
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  const data = await fetchMeRequest()
  if (!data.success) return rejectWithValue(data)
  return data
})

const initialState = {
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
      })
      .addCase(signin.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
      .addCase(fetchMe.pending, (state) => {
        // Only the very first check should show a loading state; later refreshes
        // must not flash the header back to "signed out".
        if (state.status === 'idle') state.status = 'loading'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = action.payload?.message || 'Something went wrong'
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => {
          state.error = null
        }
      )
  },
})

export const { clearAuthError } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectAuthReady = (state) => state.auth.status !== 'idle' && state.auth.status !== 'loading'

export default authSlice.reducer
