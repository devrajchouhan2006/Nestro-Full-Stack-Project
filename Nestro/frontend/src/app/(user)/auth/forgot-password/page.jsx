import AuthLayout from '@website/auth/AuthLayout'
import ForgotPasswordForm from '@website/auth/ForgotPasswordForm'

export const metadata = { title: 'Forgot password — Nestro' }

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
