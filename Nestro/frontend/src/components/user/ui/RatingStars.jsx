import { IconStar, IconStarFilled, IconStarHalfFilled } from '@tabler/icons-react'

export default function RatingStars({ rating = 0, reviews, size = 12 }) {
  return (
    <div className="flex items-center gap-1" title={`${Number(rating).toFixed(1)} out of 5`}>
      <div className="flex items-center text-[#C6A27E]">
        {[1, 2, 3, 4, 5].map((position) => {
          // Half stars matter once ratings are real averages rather than whole numbers.
          const Icon =
            rating >= position ? IconStarFilled
              : rating >= position - 0.5 ? IconStarHalfFilled
                : IconStar
          const muted = rating < position - 0.5
          return (
            <Icon
              key={position}
              size={size}
              stroke={1.6}
              className={muted ? 'text-[#E8E0D5]' : ''}
            />
          )
        })}
      </div>
      {reviews !== undefined && (
        <span className="text-[10px] text-[#6B7280] tabular-nums">({reviews})</span>
      )}
    </div>
  )
}
