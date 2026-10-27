'use client'

// Named colours the catalogue actually uses; anything else falls back to the
// swatch label so an unknown colour is never rendered as a grey blob.
const colorMap = {
  Ivory: '#F5F0E8',
  Cream: '#EFE7DA',
  Walnut: '#7B4F2E',
  Oak: '#C8A87C',
  Teak: '#96643B',
  Ebony: '#2C1810',
  Charcoal: '#3A3A3A',
  Slate: '#6B7280',
  Sage: '#9CAF9B',
  Rust: '#A5502F',
}

export default function VariantSelector({ variants = [], selectedKey, onSelect }) {
  if (!variants.length) return null

  // Split into colour and size axes when the data has them, otherwise show a
  // single row of labelled options.
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))]
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]
  const selected = variants.find((v) => v.key === selectedKey)

  const pick = (patch) => {
    const next =
      variants.find(
        (v) =>
          (patch.color ?? selected?.color) === v.color &&
          (patch.size ?? selected?.size) === v.size
      ) || variants.find((v) => v.color === patch.color || v.size === patch.size)
    if (next) onSelect(next.key)
  }

  if (!colors.length && !sizes.length) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">
          Option: <span className="text-[#1E1E1E] font-medium normal-case tracking-normal">{selected?.label}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.key}
              type="button"
              onClick={() => onSelect(variant.key)}
              disabled={variant.stockQty === 0}
              className={`px-4 py-2 border rounded-md text-[12px] font-medium transition-all disabled:opacity-40 disabled:line-through ${
                variant.key === selectedKey
                  ? 'border-[#8B5E3C] bg-[#FFF8F5] text-[#8B5E3C]'
                  : 'border-[#E8E0D5] text-[#6B7280] hover:border-[#C6A27E] hover:text-[#8B5E3C]'
              }`}
            >
              {variant.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">
            Finish: <span className="text-[#1E1E1E] font-medium normal-case tracking-normal">{selected?.color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Select finish ${color}`}
                aria-pressed={selected?.color === color}
                onClick={() => pick({ color })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selected?.color === color
                    ? 'border-[#8B5E3C] scale-110 shadow-md'
                    : 'border-[#E8E0D5] hover:border-[#C6A27E]'
                }`}
                style={{ backgroundColor: colorMap[color] ?? '#D8CDC0' }}
              />
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">
            Size: <span className="text-[#1E1E1E] font-medium normal-case tracking-normal">{selected?.size}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const soldOut = variants
                .filter((v) => v.size === size)
                .every((v) => v.stockQty === 0)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => pick({ size })}
                  disabled={soldOut}
                  className={`px-4 py-2 border rounded-md text-[12px] font-medium transition-all disabled:opacity-40 disabled:line-through ${
                    selected?.size === size
                      ? 'border-[#8B5E3C] bg-[#FFF8F5] text-[#8B5E3C]'
                      : 'border-[#E8E0D5] text-[#6B7280] hover:border-[#C6A27E] hover:text-[#8B5E3C]'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
