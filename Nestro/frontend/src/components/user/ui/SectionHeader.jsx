import Link from 'next/link'

export default function SectionHeader({
  tag,
  title,
  showLink = false,
  linkText = 'View All',
  linkHref = '#',
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-8">
      <div className="flex flex-col gap-1">
        {tag && (
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#8B5E3C]">
            {tag}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-normal text-[#1E1E1E] leading-tight">
          {title}
        </h2>
      </div>

      {showLink && (
        <Link
          href={linkHref}
          className="text-[11px] text-[#8B5E3C] border-b border-[#C6A27E] pb-px hover:opacity-70 transition-opacity self-start sm:self-auto whitespace-nowrap"
        >
          {linkText}
        </Link>
      )}
    </div>
  )
}