import { IconBrandGoogle, IconBrandApple } from '@tabler/icons-react'

const iconMap = {
  google: IconBrandGoogle,
  apple: IconBrandApple,
}

export default function SocialButton({ provider, label }) {
  const Icon = iconMap[provider]
  return (
    <button
      type="button"
      className="w-full border border-[#E8E0D5] rounded-md py-2.5 flex items-center justify-center gap-2 text-[13px] text-[#1E1E1E] hover:bg-[#F5EDE4] transition-colors"
    >
      {Icon && <Icon size={18} stroke={1.8} />}
      {label}
    </button>
  )
}