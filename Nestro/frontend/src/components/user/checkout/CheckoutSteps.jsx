import { IconShoppingBag, IconTruck, IconCreditCard, IconCircleCheck, IconCheck } from '@tabler/icons-react'

const steps = [
  { number: 1, label: 'Cart', Icon: IconShoppingBag },
  { number: 2, label: 'Delivery', Icon: IconTruck },
  { number: 3, label: 'Payment', Icon: IconCreditCard },
  { number: 4, label: 'Review', Icon: IconCircleCheck },
]

export default function CheckoutSteps({ currentStep = 2 }) {
  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 mb-6">
      <ol className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const done = step.number < currentStep
          const active = step.number === currentStep
          const { Icon } = step
          return (
            <li key={step.number} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    active ? 'bg-[#8B5E3C] text-white'
                      : done ? 'bg-[#C6A27E] text-white'
                        : 'bg-[#F0EBE3] text-[#6B7280]'
                  }`}
                >
                  {done ? <IconCheck size={16} stroke={2.2} /> : <Icon size={16} stroke={1.8} />}
                </div>
                <span className={`text-[11px] whitespace-nowrap ${
                  active ? 'text-[#8B5E3C] font-medium' : done ? 'text-[#C6A27E]' : 'text-[#6B7280]'
                }`}>
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`h-[2px] w-8 md:w-12 flex-shrink-0 transition-colors ${
                    done ? 'bg-[#C6A27E]' : 'bg-[#E8E0D5]'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
