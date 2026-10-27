import { formatPrice } from './helper'

export function getProductBadge(product) {
    if (product.newArrival) return { type: 'new', text: 'New' }
    if (product.bestSeller) return { type: 'hot', text: 'Bestseller' }
    if (product.discount >= 10) return { type: 'sale', text: `${product.discount}% off` }
    return null
}

export function getOldPrice(product) {
    return product.originalPrice && product.originalPrice !== product.salePrice
        ? formatPrice(product.originalPrice)
        : null
}

// Products with variants advertise the cheapest option on the card.
export function displayPrice(product) {
    if (product.variants?.length) {
        return Math.min(...product.variants.map((v) => v.salePrice))
    }
    return product.salePrice
}

export function isInStock(product) {
    if (product.variants?.length) {
        return product.variants.some((v) => v.stockQty > 0)
    }
    return (product.stockQty ?? 0) > 0
}

// Every image the gallery should show, thumbnail first, no duplicates.
export function galleryImages(product) {
    const images = [product.thumbnail, ...(product.images || [])].filter(Boolean)
    return [...new Set(images)]
}

export function toProductCardProps(product) {
    const price = displayPrice(product)
    return {
        id: product._id,
        image: product.thumbnail || product.images?.[0] || null,
        category: product.categoryId?.name,
        name: product.name,
        price: formatPrice(price),
        rawPrice: price,
        oldPrice: getOldPrice(product),
        rating: product.ratingCount ? product.ratingAvg : undefined,
        reviews: product.ratingCount || undefined,
        badge: getProductBadge(product),
        soldOut: !isInStock(product),
    }
}
