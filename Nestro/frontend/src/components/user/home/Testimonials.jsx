import SectionHeader from '@website/ui/SectionHeader'
import RatingStars from '@website/ui/RatingStars'
import { fetchFeaturedReviews } from '@/utils/api'

// Real reviews from real orders, or the section stays off the page. A
// testimonial nobody wrote is worse than no testimonials.
export default async function Testimonials() {
  const reviews = await fetchFeaturedReviews()
  if (!reviews.length) return null

  return (
    <section>
      <SectionHeader tag="From our customers" title="Living with Nestro" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.slice(0, 3).map((review) => (
          <figure
            key={review._id}
            className="bg-white border border-[#E8E0D5] rounded-xl p-6 flex flex-col gap-3"
          >
            <RatingStars rating={review.rating} size={13} />
            <blockquote className="text-[14px] text-[#4A423B] leading-relaxed flex-1">
              {review.title ? (
                <span className="block font-medium text-[#1E1E1E] mb-1">{review.title}</span>
              ) : null}
              {review.comment}
            </blockquote>
            <figcaption className="text-[12px] text-[#6B7280] border-t border-[#E8E0D5] pt-3">
              <span className="text-[#1E1E1E] font-medium">{review.userName}</span>
              {review.productId?.name && <span> · {review.productId.name}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
