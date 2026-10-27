'use client'

import { Suspense, useState } from 'react'
import AuthLayout from '@website/auth/AuthLayout'
import AuthTabs from '@website/auth/AuthTabs'
import SignInForm from '@website/auth/SignInForm'
import SignUpForm from '@website/auth/SignUpForm'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')

  return (
    <AuthLayout>
      <AuthTabs mode={mode} setMode={setMode} />
      {/* Both forms read the ?next= param, which needs a Suspense boundary. */}
      <Suspense fallback={null}>
        {mode === 'signin' ? (
          <SignInForm onSwitch={() => setMode('signup')} />
        ) : (
          <SignUpForm onSwitch={() => setMode('signin')} />
        )}
      </Suspense>
    </AuthLayout>
  )
}
