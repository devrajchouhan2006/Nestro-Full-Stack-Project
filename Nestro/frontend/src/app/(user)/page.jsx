import Container from '@website/ui/Container'
import HeroSlider from '@website/home/HeroSlider'
import Categories from '@website/home/Categories'
import BestSellers from '@website/home/BestSellers'
import JustLanded from '@website/home/JustLanded'
import ShopByRoom from '@website/home/ShopByRoom'
import CraftSection from '@website/home/CraftSection'
import USPStrip from '@website/home/USPStrip'
import Testimonials from '@website/home/Testimonials'
import Newsletter from '@website/home/Newsletter'

// Live catalogue data: stock, prices and admin sessions all change between
// deploys, so these pages render per request rather than at build time.
export const dynamic = 'force-dynamic'


export default function HomePage() {
  return (
    <>
      <Container className="mt-6">
        <HeroSlider />
      </Container>

      <Container className="mt-10">
        <Categories />
      </Container>

      <Container className="mt-16">
        <BestSellers />
      </Container>

      <Container className="mt-16">
        <JustLanded />
      </Container>

      <Container className="mt-16">
        <ShopByRoom />
      </Container>

      <Container className="mt-16">
        <CraftSection />
      </Container>

      <Container className="mt-16">
        <USPStrip />
      </Container>

      <Container className="mt-16">
        <Testimonials />
      </Container>

      <Container className="mt-16 mb-20">
        <Newsletter />
      </Container>
    </>
  )
}