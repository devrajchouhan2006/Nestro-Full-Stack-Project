import { Suspense } from 'react'
import AuthLayout from '@website/auth/AuthLayout'
import OtpVerifyForm from '@website/auth/OtpVerifyForm'

export default function OtpVerifyPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <OtpVerifyForm />
      </Suspense>
    </AuthLayout>
  )
}
