import FilterSidebar from '@/components/user/store/FilterSidebar'
import StoreHero from '@/components/user/store/StoreHero'
import Container from '@/components/user/ui/Container'
import MobileFilterDrawer from '@/components/user/store/MobileFilterDrawer'
import React from 'react'

export default function layout({ children }) {
  return (
    <>
    <Container className="mt-6">
            <StoreHero />
          </Container>
          <Container>
            <div className=' flex mt-10 mx-auto  space-x-10'>
         <div>
             <div className="hidden lg:block w-[250px] flex-shrink-0">
            <FilterSidebar />
          </div>
            <MobileFilterDrawer>
              <FilterSidebar />
            </MobileFilterDrawer>
         </div>
         <div className='w-full'>
          {children}
         </div>
          </div>
          </Container>



    </>
  )
}
