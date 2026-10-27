// Shows only what is NOT ready. A checklist of green ticks is decoration; a
// short list of what is still missing is the thing a shop actually needs to
// see before it takes a real customer's money.
const CHECKS = [
  {
    key: 'razorpay',
    when: (c) => !c.razorpay,
    title: 'Online payment is off',
    detail: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not set, so checkout can only offer Cash on Delivery.',
    severity: 'error',
  },
  {
    key: 'email',
    when: (c) => !c.email,
    title: 'Email is not being sent',
    detail: 'EMAIL_USER and EMAIL_PASS are not set. Signup codes and order confirmations are written to backend/.mail-outbox/ instead of reaching anyone.',
    severity: 'error',
  },
  {
    key: 'webhook',
    when: (c) => c.razorpay && !c.razorpayWebhook,
    title: 'Razorpay webhook is not configured',
    detail: 'Payments still confirm through the browser, but a shopper who pays and closes the tab straight away leaves an order stuck unpaid.',
    severity: 'warn',
  },
  {
    key: 'cloudinary',
    when: (c) => !c.cloudinary,
    title: 'Image uploads are off',
    detail: 'CLOUD_NAME, API_KEY and API_SECRET are not set, so new product images cannot be uploaded.',
    severity: 'warn',
  },
  {
    key: 'testmode',
    when: (c) => c.razorpay && !c.razorpayLive,
    title: 'Razorpay is in test mode',
    detail: 'Orders take test cards only — no real money moves. Swap in the live keys when you are ready to sell.',
    severity: 'info',
  },
]

const TONE = {
  error: 'border-red-200 bg-red-50 text-red-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
}

export default function SetupChecklist({ config }) {
  if (!config) return null

  const open = CHECKS.filter((check) => check.when(config))
  if (open.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {open.map((check) => (
        <div key={check.key} className={`border rounded-xl px-4 py-3 ${TONE[check.severity]}`}>
          <p className="text-sm font-medium">{check.title}</p>
          <p className="text-xs mt-0.5 opacity-80">{check.detail}</p>
        </div>
      ))}
    </div>
  )
}
