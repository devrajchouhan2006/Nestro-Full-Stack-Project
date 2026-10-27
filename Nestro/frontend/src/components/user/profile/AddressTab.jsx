'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  IconHome, IconBuilding, IconMapPin, IconPlus, IconLoader2, IconTrash, IconPencil,
} from '@tabler/icons-react'
import {
  fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '@/utils/api'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-[#FAFAF9] outline-none focus:border-[#C6A27E] transition-colors'
const labelClass = 'text-[11px] uppercase tracking-[0.08em] text-[#6B7280]'

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const labelIcon = { Home: IconHome, Office: IconBuilding, Other: IconMapPin }

// Module scope for the same reason as DeliveryForm: a component defined during
// render remounts its input on every keystroke.
function Field({ name, label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} htmlFor={`addr-${name}`}>{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  )
}

const blank = {
  label: 'Home', fullName: '', phone: '', line1: '', line2: '',
  city: '', state: 'Rajasthan', pincode: '', isDefault: false,
}

const validate = (form) => {
  const errors = {}
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter a name'
  if (!/^[+]?[0-9\s-]{7,15}$/.test(form.phone.trim())) errors.phone = 'Enter a valid phone number'
  if (form.line1.trim().length < 3) errors.line1 = 'Enter a street address'
  if (form.city.trim().length < 2) errors.city = 'Enter a city'
  if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code'
  return errors
}

export default function AddressTab() {
  const [addresses, setAddresses] = useState([])
  const [state, setState] = useState('loading')
  const [editing, setEditing] = useState(null)  // null | 'new' | address id
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await fetchAddresses()
    if (data.success) { setAddresses(data.addresses); setState('ready') }
    else setState('error')
  }

  useEffect(() => {
    let alive = true
    fetchAddresses().then((data) => {
      if (!alive) return
      if (data.success) { setAddresses(data.addresses); setState('ready') }
      else setState('error')
    })
    return () => { alive = false }
  }, [])

  const startNew = () => { setForm(blank); setErrors({}); setEditing('new') }
  const startEdit = (address) => {
    setForm({ ...blank, ...address })
    setErrors({})
    setEditing(address._id)
  }

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSave = async (event) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    const payload = {
      label: form.label, fullName: form.fullName.trim(), phone: form.phone.trim(),
      line1: form.line1.trim(), line2: form.line2.trim(), city: form.city.trim(),
      state: form.state, pincode: form.pincode.trim(), isDefault: Boolean(form.isDefault),
    }
    const data = editing === 'new'
      ? await createAddress(payload)
      : await updateAddress(editing, payload)
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success(editing === 'new' ? 'Address saved' : 'Address updated')
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    const data = await deleteAddress(id)
    if (!data.success) return toast.error(data.message)
    toast.success('Address removed')
    load()
  }

  const handleDefault = async (id) => {
    const data = await setDefaultAddress(id)
    if (!data.success) return toast.error(data.message)
    load()
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#6B7280] text-[13px]">
        <IconLoader2 size={16} className="animate-spin" /> Loading addresses…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.map((address) => {
        const Icon = labelIcon[address.label] || IconMapPin
        if (editing === address._id) return renderForm(address._id)
        return (
          <div key={address._id} className="bg-white border border-[#E8E0D5] rounded-xl p-5 flex gap-4">
            <Icon size={18} stroke={1.7} className="text-[#8B5E3C] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#1E1E1E]">
                {address.fullName}
                <span className="ml-2 text-[10px] uppercase tracking-[0.08em] text-[#8B5E3C]">{address.label}</span>
                {address.isDefault && (
                  <span className="ml-2 text-[10px] text-white bg-[#8B5E3C] px-1.5 py-0.5 rounded">Default</span>
                )}
              </p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mt-1">
                {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                {address.city}, {address.state} {address.pincode}<br />
                {address.phone}
              </p>
              <div className="flex gap-4 mt-3">
                <button type="button" onClick={() => startEdit(address)} className="flex items-center gap-1 text-[11px] text-[#8B5E3C] hover:underline">
                  <IconPencil size={12} stroke={1.8} /> Edit
                </button>
                {!address.isDefault && (
                  <>
                    <button type="button" onClick={() => handleDefault(address._id)} className="text-[11px] text-[#8B5E3C] hover:underline">
                      Make default
                    </button>
                    <button type="button" onClick={() => handleDelete(address._id)} className="flex items-center gap-1 text-[11px] text-red-600 hover:underline">
                      <IconTrash size={12} stroke={1.8} /> Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {editing === 'new' ? renderForm('new') : (
        <button
          type="button"
          onClick={startNew}
          className="flex items-center justify-center gap-2 text-[12px] px-4 py-4 border border-dashed border-[#C6A27E] rounded-xl text-[#8B5E3C] hover:bg-[#FFF8F5] transition-colors"
        >
          <IconPlus size={15} stroke={1.8} /> Add a new address
        </button>
      )}
    </div>
  )

  function renderForm(key) {
    return (
      <form key={key} onSubmit={handleSave} className="bg-white border border-[#8B5E3C] rounded-xl p-5 flex flex-col gap-4">
        <p className="text-[13px] font-medium text-[#1E1E1E]">
          {key === 'new' ? 'New address' : 'Edit address'}
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="fullName" label="Full name" error={errors.fullName}>
            <input id="addr-fullName" className={inputClass} value={form.fullName} onChange={set('fullName')} />
          </Field>
          <Field name="phone" label="Phone" error={errors.phone}>
            <input id="addr-phone" className={inputClass} value={form.phone} onChange={set('phone')} inputMode="tel" />
          </Field>
        </div>

        <Field name="line1" label="Address" error={errors.line1}>
          <input id="addr-line1" className={inputClass} value={form.line1} onChange={set('line1')} />
        </Field>
        <Field name="line2" label="Apartment, landmark (optional)" error={errors.line2}>
          <input id="addr-line2" className={inputClass} value={form.line2} onChange={set('line2')} />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field name="city" label="City" error={errors.city}>
            <input id="addr-city" className={inputClass} value={form.city} onChange={set('city')} />
          </Field>
          <Field name="state" label="State" error={errors.state}>
            <select id="addr-state" className={`${inputClass} cursor-pointer`} value={form.state} onChange={set('state')}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field name="pincode" label="PIN code" error={errors.pincode}>
            <input id="addr-pincode" className={inputClass} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Field name="label" label="Save as" error={errors.label}>
            <select id="addr-label" className={`${inputClass} cursor-pointer`} value={form.label} onChange={set('label')}>
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-[12px] text-[#6B7280] cursor-pointer mt-5">
            <input
              type="checkbox"
              checked={Boolean(form.isDefault)}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="accent-[#8B5E3C] w-4 h-4"
            />
            Use as my default address
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save address'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium border border-[#E8E0D5] text-[#6B7280] hover:bg-[#F8F5F1]"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }
}
