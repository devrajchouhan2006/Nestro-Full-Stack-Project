import Link from 'next/link'
import { IconBrandInstagram, IconBrandPinterest, IconBrandYoutube } from '@tabler/icons-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#1A1208] to-[#2C2016] text-white pt-12 pb-6">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Column 1 */}
          <div>
            <div className="text-[14px] tracking-[0.12em] uppercase text-[#D6BFA7] mb-3 font-medium">
              NESTRO.
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed mb-5">
              Curated furniture for thoughtful homes. Crafted with intention, made to endure.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-white/10 border border-[#C6A27E]/30 text-[#D6BFA7] placeholder-white/30 px-3 py-2 text-[11px] rounded-l-md outline-none"
              />
              <button className="bg-[#8B5E3C] hover:bg-[#6F4A2E] text-white px-4 text-[11px] rounded-r-md transition">
                Subscribe
              </button>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <div className="text-[9px] tracking-[0.18em] uppercase text-[#C6A27E] mb-4 font-medium">
              Company
            </div>
            <div className="flex flex-col gap-2 text-[11px] text-white/40">
              <Link href="/about" className="hover:text-[#D6BFA7] transition">Our Story</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Sustainability</Link>
              <Link href="/contact" className="hover:text-[#D6BFA7] transition">Showrooms</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Careers</Link>
            </div>
          </div>

          {/* Column 3 */}
          <div>
            <div className="text-[9px] tracking-[0.18em] uppercase text-[#C6A27E] mb-4 font-medium">
              Support
            </div>
            <div className="flex flex-col gap-2 text-[11px] text-white/40">
              <Link href="#" className="hover:text-[#D6BFA7] transition">Track Order</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Returns & Exchange</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Assembly Help</Link>
              <Link href="/contact" className="hover:text-[#D6BFA7] transition">Contact Us</Link>
            </div>
          </div>

          {/* Column 4 */}
          <div>
            <div className="text-[9px] tracking-[0.18em] uppercase text-[#C6A27E] mb-4 font-medium">
              Follow Us
            </div>
            <div className="flex flex-col gap-2 text-[11px] text-white/40 mb-4">
              <Link href="#" className="hover:text-[#D6BFA7] transition">Instagram</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Pinterest</Link>
              <Link href="#" className="hover:text-[#D6BFA7] transition">Houzz</Link>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="w-7 h-7 rounded-full border border-[#C6A27E]/40 flex items-center justify-center text-[#C6A27E] hover:bg-[#8B5E3C] hover:text-white transition"
              >
                <IconBrandInstagram size={14} stroke={1.8} />
              </a>
              <a
                href="#"
                aria-label="Pinterest"
                className="w-7 h-7 rounded-full border border-[#C6A27E]/40 flex items-center justify-center text-[#C6A27E] hover:bg-[#8B5E3C] hover:text-white transition"
              >
                <IconBrandPinterest size={14} stroke={1.8} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-7 h-7 rounded-full border border-[#C6A27E]/40 flex items-center justify-center text-[#C6A27E] hover:bg-[#8B5E3C] hover:text-white transition"
              >
                <IconBrandYoutube size={14} stroke={1.8} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30">
          <div>© 2026 Nestro. All rights reserved.</div>
          <div className="mt-2 md:mt-0">Privacy · Terms · Sitemap</div>
        </div>

      </div>
    </footer>
  )
}