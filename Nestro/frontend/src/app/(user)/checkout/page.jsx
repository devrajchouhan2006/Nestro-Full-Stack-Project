'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { IconLoader2 } from '@tabler/icons-react'

import Container from '@website/ui/Container'
import CheckoutSteps from '@website/checkout/CheckoutSteps'
import DeliveryForm from '@website/checkout/DeliveryForm'
import ShippingMethod, { shippingOptions } from '@website/checkout/ShippingMethod'
import PaymentSection from '@website/checkout/PaymentSection'
import PromoCode from '@website/checkout/PromoCode'
import OrderSummary from '@website/checkout/OrderSummary'
import PurchaseProtection from '@website/checkout/PurchaseProtection'

import { clearCart, selectCartItems, selectCartSubtotal } from '@/redux/slices/cartSlice'
import { createOrder, fetchAddresses, verifyPayment } from '@/utils/api'
import { formatPrice } from '@/utils/helper'
import { openRazorpayCheckout } from '@/utils/razorpay'

const emptyForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: 'Rajasthan',
  pincode: '',
  saveAddress: true,
}

// A fresh id for each checkout attempt. crypto.randomUUID is available in every
// browser this app targets; the fallback only matters for insecure origins.
const newAttemptKey = () =>
  (globalThis.crypto?.randomUUID?.() ?? `k-${Date.now()}-${Math.random().toString(36).slice(2)}`)

const validate = (form) => {
  const errors = {}
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter the recipient name'
  if (!/^[+]?[0-9\s-]{7,15}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number'
  if (form.line1.trim().length < 3) errors.line1 = 'Enter a street address'
  if (form.city.trim().length < 2) errors.city = 'Enter a city'
  if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code'
  return errors
}

export default function CheckoutPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const cartItems = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartSubtotal)
  const user = useSelector((state) => state.auth.user)
  const authStatus = useSelector((state) => state.auth.status)

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useNew, setUseNew] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [coupon, setCoupon] = useState(null)
  const [placing, setPlacing] = useState(false)

  // Held in a ref, not state, because changing it must never re-render: it has
  // to stay identical across every retry of one attempt, and only turn over
  // once an order has actually been placed.
  const attemptKey = useRef(newAttemptKey())

  const onlineAvailable = process.env.NEXT_PUBLIC_RAZORPAY_ENABLED !== 'false'
  const shippingCost = shippingOptions.find((o) => o.id === shippingMethod)?.price ?? 0

  // A coupon is priced against one subtotal. If the cart changes underneath it,
  // it stops applying — derived here rather than cleared from an effect, so the
  // displayed discount and the one the server recomputes can never disagree.
  const activeCoupon = coupon && coupon.forSubtotal === subtotal ? coupon : null
  const discount = activeCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shippingCost - discount)

  // A guest cannot place an order, so send them to sign in and back again.
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/auth?next=/checkout')
  }, [authStatus, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    fetchAddresses().then((data) => {
      if (cancelled || !data.success) return
      setAddresses(data.addresses)
      const preferred = data.addresses.find((a) => a.isDefault) || data.addresses[0]
      if (preferred) setSelectedAddressId(preferred._id)
      else setUseNew(true)
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || [user.firstName, user.lastName].filter(Boolean).join(' '),
        phone: prev.phone || user.phone || '',
      }))
    })

    return () => { cancelled = true }
  }, [user])

  const usingNewAddress = useNew || addresses.length === 0

  const buildPayload = () => ({
    items: cartItems.map((item) => ({
      productId: item.productId,
      variantKey: item.variantKey || '',
      quantity: item.quantity,
    })),
    ...(usingNewAddress
      ? { address: { ...form, fullName: form.fullName.trim(), phone: form.phone.trim() } }
      : { addressId: selectedAddressId }),
    shippingMethod,
    paymentMethod,
    couponCode: activeCoupon?.code || '',
  })

  const activeAddress = addresses.find((a) => a._id === selectedAddressId)

  const handlePlaceOrder = async () => {
    if (!cartItems.length) return toast.error('Your cart is empty')

    if (usingNewAddress) {
      const found = validate(form)
      setErrors(found)
      if (Object.keys(found).length) return toast.error('Please check the delivery details')
    } else if (!selectedAddressId) {
      return toast.error('Choose a delivery address')
    }

    setPlacing(true)
    const data = await createOrder(buildPayload(), attemptKey.current)

    if (!data.success) {
      setPlacing(false)
      // A failed attempt keeps its key, so retrying the same cart is still
      // recognised as one intent rather than becoming a second order.
      return toast.error(data.message)
    }

    // The order now exists on the server. From here the key has done its job —
    // a later checkout in the same session must be free to become a new order.
    attemptKey.current = newAttemptKey()

    // Cash on delivery is done the moment the server accepts it.
    if (paymentMethod === 'cod') {
      dispatch(clearCart())
      setPlacing(false)
      router.push(`/order-confirmed/${data.order._id}`)
      return
    }

    const result = await openRazorpayCheckout({
      razorpay: data.razorpay,
      order: data.order,
      prefill: {
        name: usingNewAddress ? form.fullName : activeAddress?.fullName,
        email: user?.email,
        contact: usingNewAddress ? form.phone : activeAddress?.phone,
      },
      verify: verifyPayment,
    })

    setPlacing(false)

    if (result.status === 'paid') {
      dispatch(clearCart())
      router.push(`/order-confirmed/${data.order._id}`)
      return
    }

    if (result.status === 'dismissed') {
      // The order row exists and is payable — say so rather than leaving the
      // shopper thinking nothing happened.
      return toast.message('Payment cancelled', {
        description: 'Your order is saved — you can pay for it from My Orders.',
      })
    }

    toast.error(result.message || 'That payment did not go through')
  }

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex items-center justify-center gap-2 py-24 text-[#6B7280] text-[13px]">
          <IconLoader2 size={16} className="animate-spin" /> Loading checkout…
        </div>
      </Container>
    )
  }

  if (!cartItems.length) {
    return (
      <Container className="mt-10 mb-20">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-xl font-medium text-[#1E1E1E]">Your cart is empty</p>
          <p className="text-sm text-[#6B7280]">Add something you love before checking out.</p>
          <Link
            href="/store"
            className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90"
          >
            Browse store
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="mt-10 mb-20">
      <h1 className="text-2xl font-medium text-[#1E1E1E] mb-6">Checkout</h1>

      <CheckoutSteps currentStep={2} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-[15px] font-medium text-[#1E1E1E]">Delivery address</h2>
            <DeliveryForm
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              form={form}
              setForm={setForm}
              errors={errors}
              useNew={usingNewAddress}
              setUseNew={setUseNew}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-[15px] font-medium text-[#1E1E1E]">Shipping method</h2>
            <ShippingMethod selected={shippingMethod} setSelected={setShippingMethod} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-[15px] font-medium text-[#1E1E1E]">Payment</h2>
            <PaymentSection
              selected={paymentMethod}
              setSelected={setPaymentMethod}
              onlineAvailable={onlineAvailable}
            />
          </section>
        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-[74px]">
          <OrderSummary shippingCost={shippingCost} discount={discount} couponCode={activeCoupon?.code} />

          <PromoCode
            subtotal={subtotal}
            applied={activeCoupon}
            onApply={(applied) => setCoupon({ ...applied, forSubtotal: subtotal })}
            onClear={() => setCoupon(null)}
            disabled={placing}
          />

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full flex items-center justify-center gap-2 text-[11px] tracking-[0.08em] uppercase px-5 py-3.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {placing && <IconLoader2 size={14} className="animate-spin" />}
            {placing
              ? 'Working…'
              : paymentMethod === 'cod'
                ? `Place order · ${formatPrice(total)}`
                : `Pay ${formatPrice(total)}`}
          </button>

          <PurchaseProtection />
        </div>
      </div>
    </Container>
  )
}
