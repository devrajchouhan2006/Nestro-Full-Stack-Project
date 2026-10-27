const variantClasses = {
  primary: 'bg-[#8B5E3C] text-white hover:opacity-90',
  outline: 'border border-[#C6A27E] text-[#8B5E3C] hover:bg-[#F0EBE3]',
  dark: 'bg-[#2C2016] text-[#D6BFA7] hover:opacity-90',
}

export default function Button({ variant = 'primary', children, className = '', ...props }) {
  return (
    <button
      className={`text-[11px] tracking-[0.08em] px-5 py-2.5 rounded font-medium transition-all cursor-pointer ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}