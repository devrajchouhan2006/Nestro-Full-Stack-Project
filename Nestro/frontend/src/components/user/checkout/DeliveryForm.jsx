'use client'

import { IconMapPin, IconPlus, IconHome, IconBuilding } from '@tabler/icons-react'

const inputClass =
  'w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] text-[#1E1E1E] bg-white outline-none focus:border-[#C6A27E] transition-colors placeholder-[#aaa]'
const labelClass = 'text-[11px] text-[#6B7280]'

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const labelIcon = { Home: IconHome, Office: IconBuilding, Other: IconMapPin }

// Declared here, not inside the component: a component created during render is
// a brand-new type on every keystroke, which remounts the input and drops focus.
function Field({ name, label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} htmlFor={`delivery-${name}`}>{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  )
}

export default function DeliveryForm({
  addresses = [],
  selectedId,
  onSelect,
  form,
  setForm,
  errors = {},
  useNew,
  setUseNew,
}) {
  const set = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }))

  return (
    <div className="flex flex-col gap-5">
      {addresses.length > 0 && (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => {
            const Icon = labelIcon[address.label] || IconMapPin
            const active = !useNew && selectedId === address._id
            return (
              <button
                key={address._id}
                type="button"
                onClick={() => { onSelect(address._id); setUseNew(false) }}
                className={`w-full flex items-start gap-3 border rounded-lg p-4 text-left transition-all ${
                  active ? 'border-[#8B5E3C] bg-[#FFF8F5]' : 'border-[#E8E0D5] bg-white hover:border-[#C6A27E]'
                }`}
              >
                <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  active ? 'border-[#8B5E3C]' : 'border-[#C6A27E]'
                }`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C]" />}
                </div>
                <Icon size={17} stroke={1.7} className="text-[#8B5E3C] flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#1E1E1E]">
                    {address.fullName}
                    <span className="ml-2 text-[10px] uppercase tracking-[0.08em] text-[#8B5E3C]">{address.label}</span>
                    {address.isDefault && (
                      <span className="ml-2 text-[10px] text-[#6B7280]">Default</span>
                    )}
                  </p>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed">
                    {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">{address.phone}</p>
                </div>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setUseNew(true)}
            className={`flex items-center gap-2 text-[12px] px-4 py-3 border rounded-lg transition-all ${
              useNew ? 'border-[#8B5E3C] bg-[#FFF8F5] text-[#8B5E3C]' : 'border-dashed border-[#C6A27E] text-[#8B5E3C] hover:bg-[#FFF8F5]'
            }`}
          >
            <IconPlus size={15} stroke={1.8} />
            Deliver somewhere else
          </button>
        </div>
      )}

      {(useNew || addresses.length === 0) && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="fullName" label="Full name" error={errors.fullName}>
              <input id="delivery-fullName" className={inputClass} value={form.fullName} onChange={set('fullName')} autoComplete="name" />
            </Field>
            <Field name="phone" label="Phone" error={errors.phone}>
              <input id="delivery-phone" className={inputClass} value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
            </Field>
          </div>

          <Field name="line1" label="Address" error={errors.line1}>
            <input id="delivery-line1" className={inputClass} value={form.line1} onChange={set('line1')} autoComplete="address-line1" />
          </Field>

          <Field name="line2" label="Apartment, landmark (optional)" error={errors.line2}>
            <input id="delivery-line2" className={inputClass} value={form.line2} onChange={set('line2')} autoComplete="address-line2" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="city" label="City" error={errors.city}>
              <input id="delivery-city" className={inputClass} value={form.city} onChange={set('city')} autoComplete="address-level2" />
            </Field>
            <Field name="pincode" label="PIN code" error={errors.pincode}>
              <input id="delivery-pincode" className={inputClass} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="state" label="State" error={errors.state}>
              <select id="delivery-state" className={`${inputClass} cursor-pointer`} value={form.state} onChange={set('state')} autoComplete="address-level1">
                {STATES.map((state) => <option key={state}>{state}</option>)}
              </select>
            </Field>
            <Field name="label" label="Save as" error={errors.label}>
              <select id="delivery-label" className={`${inputClass} cursor-pointer`} value={form.label} onChange={set('label')}>
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#6B7280] cursor-pointer">
            <input
              type="checkbox"
              checked={form.saveAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, saveAddress: e.target.checked }))}
              className="accent-[#8B5E3C] w-4 h-4"
            />
            Save this address for next time
          </label>
        </div>
      )}
    </div>
  )
}
