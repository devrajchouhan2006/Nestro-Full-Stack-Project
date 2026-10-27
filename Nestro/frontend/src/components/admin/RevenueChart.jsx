'use client'

import { useId, useState } from 'react'

// A small dependency-free area chart. Recharts would be many times the bytes
// for one sparkline on one screen.
export default function RevenueChart({ series = [] }) {
  const gradientId = useId()
  const [hover, setHover] = useState(null)

  if (!series.length) return null

  const width = 720
  const height = 200
  const padX = 8
  const padY = 12

  const max = Math.max(...series.map((d) => d.revenue), 1)
  const stepX = (width - padX * 2) / Math.max(series.length - 1, 1)

  const pointAt = (index) => ({
    x: padX + index * stepX,
    y: padY + (height - padY * 2) * (1 - series[index].revenue / max),
  })

  const points = series.map((_, i) => pointAt(i))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${points.at(-1).x.toFixed(1)},${height - padY} L${points[0].x.toFixed(1)},${height - padY} Z`

  const rupees = (value) => `₹${Number(value).toLocaleString('en-IN')}`
  const active = hover !== null ? series[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[200px]"
        role="img"
        aria-label={`Revenue over the last ${series.length} days, peaking at ${rupees(max)}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b497e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3b497e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Faint grid, so a flat stretch still reads as a scale rather than a bug. */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={padX}
            x2={width - padX}
            y1={padY + (height - padY * 2) * fraction}
            y2={padY + (height - padY * 2) * fraction}
            stroke="#F1F1F4"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#3b497e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {active && (
          <>
            <line
              x1={pointAt(hover).x}
              x2={pointAt(hover).x}
              y1={padY}
              y2={height - padY}
              stroke="#C6C9D4"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={pointAt(hover).x} cy={pointAt(hover).y} r="4" fill="#3b497e" stroke="#fff" strokeWidth="2" />
          </>
        )}

        {/* Invisible hit areas: one column per day. */}
        {series.map((day, index) => (
          <rect
            key={day.date}
            x={pointAt(index).x - stepX / 2}
            y={0}
            width={stepX}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          />
        ))}
      </svg>

      <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 -mt-1 gap-3">
        <span className="shrink-0">{series[0]?.date}</span>
        <span className="text-gray-600 font-medium tabular-nums text-center truncate">
          {active
            ? `${active.date} · ${rupees(active.revenue)} · ${active.orders} order${active.orders === 1 ? '' : 's'}`
            : `Peak ${rupees(max)}`}
        </span>
        <span className="shrink-0">{series.at(-1)?.date}</span>
      </div>
    </div>
  )
}
