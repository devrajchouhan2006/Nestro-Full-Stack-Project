'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { IconCircleCheck, IconStar, IconStarFilled } from '@tabler/icons-react'
import RatingStars from '@/components/user/ui/RatingStars'
import { createReview, fetchReviews } from '@/utils/api'
import { formatDate } from '@/utils/helper'

const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'specs', label: 'Specifications' },
  { id: 'reviews', label: 'Reviews' },
]

function Specs({ product }) {
  const rows = [
    ['Material', product.material],
    ['Colour', product.color],
    ['Width', product.dimensions?.width && `${product.dimensions.width} cm`],
    ['Height', product.dimensions?.height && `${product.dimensions.height} cm`],
    ['Depth', product.dimensions?.depth && `${product.dimensions.depth} cm`],
    ['Weight', product.weight && `${product.weight} kg`],
    ['Room', product.roomId?.name],
    ['SKU', product.sku],
  ].filter(([, value]) => value)

  if (!rows.length) {
    return <p className="text-[13px] text-[#6B7280]">Specifications for this piece are being added.</p>
  }

  return (
    <dl className="grid sm:grid-cols-2 gap-x-10">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6 py-2.5 border-b border-[#E8E0D5]">
          <dt className="text-[12px] uppercase tracking-[0.08em] text-[#6B7280]">{label}</dt>
          <dd className="text-[13px] text-[#1E1E1E] text-right">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReviewForm({ productId, onPosted }) {
  const user = useSelector((state) => state.auth.user)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return (
      <p className="text-[13px] text-[#6B7280] bg-[#FAFAF9] border border-[#E8E0D5] rounded-lg p-4">
        <a href="/auth" className="text-[#8B5E3C] hover:underline">Sign in</a> to leave a review.
      </p>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!rating) return toast.error('Choose a star rating first')
    if (comment.trim().length < 3) return toast.error('Tell us a little about the piece')

    setSaving(true)
    const data = await createReview(productId, { rating, title, comment })
    setSaving(false)

    if (!data.success) return toast.error(data.message)
    toast.success('Thanks for your review')
    setRating(0); setTitle(''); setComment('')
    onPosted()
  }

  return (
    <form onSubmit={submit} className="bg-[#FAFAF9] border border-[#E8E0D5] rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[13px] font-medium text-[#1E1E1E]">Write a review</p>

      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => {
          const Icon = value <= (hover || rating) ? IconStarFilled : IconStar
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(value)}
              onClick={() => setRating(value)}
              className="text-[#C6A27E] hover:scale-110 transition-transform"
            >
              <Icon size={20} stroke={1.6} />
            </button>
          )
        })}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Headline (optional)"
        maxLength={100}
        className="w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] bg-white outline-none focus:border-[#C6A27E]"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How is it in your home?"
        rows={3}
        maxLength={1500}
        className="w-full border border-[#E8E0D5] rounded-md px-3 py-2.5 text-[13px] bg-white outline-none focus:border-[#C6A27E] resize-y"
      />
      <button
        type="submit"
        disabled={saving}
        className="self-start text-[11px] tracking-[0.08em] uppercase px-5 py-2.5 rounded font-medium bg-[#8B5E3C] text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Posting…' : 'Post review'}
      </button>
    </form>
  )
}

function Reviews({ product, reviews, counts, refresh }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="flex flex-col gap-6" id="reviews">
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-medium text-[#1E1E1E] tabular-nums">
              {product.ratingAvg?.toFixed(1)}
            </span>
            <RatingStars rating={product.ratingAvg} />
            <span className="text-[11px] text-[#6B7280]">{total} review{total > 1 ? 's' : ''}</span>
          </div>

          <div className="flex-1 flex flex-col gap-1 max-w-sm">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = total ? (counts[star] / total) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6B7280] w-3 tabular-nums">{star}</span>
                  <div className="flex-1 h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C6A27E]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-[#6B7280] w-6 text-right tabular-nums">{counts[star]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ReviewForm productId={product._id} onPosted={refresh} />

      {reviews.length === 0 ? (
        <p className="text-[13px] text-[#6B7280]">Be the first to review this piece.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {reviews.map((review) => (
            <article key={review._id} className="border-b border-[#E8E0D5] pb-5 last:border-0">
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <span className="text-[13px] font-medium text-[#1E1E1E]">{review.userName}</span>
                <RatingStars rating={review.rating} />
                {review.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <IconCircleCheck size={11} stroke={2} /> Verified purchase
                  </span>
                )}
                <span className="text-[11px] text-[#6B7280] ml-auto">{formatDate(review.createdAt)}</span>
              </div>
              {review.title && <p className="text-[13px] font-medium text-[#1E1E1E] mb-1">{review.title}</p>}
              <p className="text-[13px] text-[#4A423B] leading-relaxed">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductTabs({ product, initialReviews = [], initialCounts }) {
  const [active, setActive] = useState('description')
  const [reviews, setReviews] = useState(initialReviews)
  const [counts, setCounts] = useState(initialCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

  const refresh = async () => {
    const data = await fetchReviews(product._id)
    setReviews(data.reviews)
    setCounts(data.counts)
  }

  return (
    <section>
      <div className="flex gap-1 border-b border-[#E8E0D5] mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-[12px] tracking-[0.06em] uppercase whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === tab.id
                ? 'border-[#8B5E3C] text-[#8B5E3C] font-medium'
                : 'border-transparent text-[#6B7280] hover:text-[#1E1E1E]'
            }`}
          >
            {tab.label}
            {tab.id === 'reviews' && product.ratingCount > 0 && (
              <span className="ml-1.5 text-[10px] text-[#6B7280]">({product.ratingCount})</span>
            )}
          </button>
        ))}
      </div>

      {active === 'description' && (
        product.description ? (
          // Descriptions are authored in the admin's rich-text editor.
          <div
            className="prose-nestro text-[14px] text-[#4A423B] leading-relaxed max-w-prose [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-[#1E1E1E]"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <p className="text-[13px] text-[#6B7280]">A full description is on its way.</p>
        )
      )}

      {active === 'specs' && <Specs product={product} />}
      {active === 'reviews' && (
        <Reviews product={product} reviews={reviews} counts={counts} refresh={refresh} />
      )}
    </section>
  )
}
