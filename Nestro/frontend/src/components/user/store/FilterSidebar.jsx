import { Suspense } from 'react'
import { fetchCategory, fetchRoom, fetchProductFacets } from "@/utils/api"
import FilterSidebarClient from './FilterSidebarClient'

export default async function FilterSidebar() {
  const [categories, rooms, facets] = await Promise.all([
    fetchCategory(),
    fetchRoom(),
    fetchProductFacets(),
  ])
  return (
    <Suspense fallback={null}>
      <FilterSidebarClient
        categories={categories.data}
        rooms={rooms.data}
        materials={facets.materials}
        colors={facets.colors}
      />
    </Suspense>
  )
}
