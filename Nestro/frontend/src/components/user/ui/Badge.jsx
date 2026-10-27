const typeClasses = {
  sale: 'bg-[#8B5E3C] text-white',
  new: 'bg-[#2C2016] text-[#D6BFA7]',
  hot: 'bg-black text-white',
  discount: 'bg-[#8B5E3C] text-white',
}

export default function Badge({ type = 'new', text }) {
  return (
    <span
      className={`text-[9px] tracking-[0.1em] uppercase px-2 py-1 rounded ${typeClasses[type]}`}
    >
      {text}
    </span>
  )
}