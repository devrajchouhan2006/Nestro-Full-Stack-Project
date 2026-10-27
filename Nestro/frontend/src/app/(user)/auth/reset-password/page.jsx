import { Suspense } from 'react'
import AuthLayout from '@website/auth/AuthLayout'
import ResetPasswordForm from '@website/auth/ResetPasswordForm'

export const metadata = { title: 'Reset password — Nestro' }

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      {/* useSearchParams needs a Suspense boundary in the app router. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
