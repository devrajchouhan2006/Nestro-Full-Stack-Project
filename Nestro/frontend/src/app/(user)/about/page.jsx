import React from 'react';
import Link from 'next/link';

// --- ICON IMPORTS ---
import { TbWorld, TbCube, TbHeart } from 'react-icons/tb';
import { FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa';

export const metadata = {
  title: 'About — Nestro',
  description: 'How Nestro works with craftsmen across India and Scandinavia to build furniture that lasts.',
}

// --- SUB-COMPONENTS ---

const ValueCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col gap-4">
    <div className="text-[#A48669] w-8 h-8 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-[15px] font-bold text-[#333333]">{title}</h3>
    <p className="text-[12px] text-gray-500 leading-relaxed">{description}</p>
  </div>
);

const TeamCard = ({ initials, name, role }) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
    {/* Image Placeholder (Initials) */}
    <div className="bg-[#FAF8F5] h-[200px] flex items-center justify-center">
      <span className="text-3xl font-medium text-[#A48669] tracking-widest">{initials}</span>
    </div>
    {/* Text Content */}
    <div className="p-5 flex flex-col">
      <h4 className="text-[13px] font-bold text-[#333333] mb-1">{name}</h4>
      <p className="text-[11px] text-gray-500">{role}</p>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FCFAF8] font-sans selection:bg-[#A48669] selection:text-white">
      
      <div className="max-w-[1400px] mx-auto px-4 mt-26 mb-8">
        <div className="w-full bg-[#3B2F25] rounded-[2rem] px-8 py-14 md:px-16 md:py-20 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden">
          <div className="z-10 w-full lg:w-[60%] flex flex-col items-start text-left">
            <h1 className="text-4xl md:text-5xl text-white font-medium leading-[1.2] mb-6">
              Furniture crafted with <span className="italic text-[#C4A98B] font-serif">purpose</span>
            </h1>
            <p className="text-gray-400 text-[14px] max-w-2xl leading-relaxed">
              Founded in 2018, Nestro was born from a belief that beautiful furniture shouldn&apos;t be a luxury. We work directly with master craftsmen across India and Scandinavia to bring you pieces that are honest in material, thoughtful in design, and built to outlast trends.
            </p>
          </div>
          
          {/* Subtle Abstract CSS Sofa */}
          <div className="z-10 hidden lg:flex w-[40%] justify-end relative mt-10 lg:mt-0 opacity-80">
            <div className="w-[280px] h-[160px] relative">
              <div className="absolute top-4 left-4 w-28 h-16 bg-[#A48669] rounded-xl opacity-40 mix-blend-overlay"></div>
              <div className="absolute top-4 right-4 w-28 h-16 bg-[#A48669] rounded-xl opacity-40 mix-blend-overlay"></div>
              <div className="absolute bottom-6 left-0 w-full h-20 bg-[#947458] rounded-2xl opacity-50 shadow-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STATS SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <div className="bg-white rounded-2xl py-8 md:py-10 px-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-around items-center gap-8 md:gap-4 divide-y md:divide-y-0 text-center">
          
          <div className="flex flex-col items-center pt-4 md:pt-0 w-full">
            <span className="text-3xl md:text-4xl font-bold text-[#8B6B50] mb-2">12K+</span>
            <span className="text-[12px] text-gray-500">Homes transformed</span>
          </div>
          
          <div className="flex flex-col items-center pt-6 md:pt-0 w-full">
            <span className="text-3xl md:text-4xl font-bold text-[#8B6B50] mb-2">280+</span>
            <span className="text-[12px] text-gray-500">Curated products</span>
          </div>
          
          <div className="flex flex-col items-center pt-6 md:pt-0 w-full">
            <span className="text-3xl md:text-4xl font-bold text-[#8B6B50] mb-2">8</span>
            <span className="text-[12px] text-gray-500">Showrooms across India</span>
          </div>
          
          <div className="flex flex-col items-center pt-6 md:pt-0 w-full">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-3xl md:text-4xl font-bold text-[#8B6B50]">4.9</span>
              <span className="text-2xl text-[#8B6B50]">★</span>
            </div>
            <span className="text-[12px] text-gray-500">Average rating</span>
          </div>

        </div>
      </div>

      {/* 4. OUR VALUES SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
        <div className="mb-8">
          <p className="text-[#A48669] text-[10px] font-bold tracking-[0.15em] uppercase mb-1">WHAT DRIVES US</p>
          <h2 className="text-2xl text-[#333333] font-medium">Our Values</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ValueCard 
            icon={<TbWorld className="w-8 h-8" strokeWidth={1.5} />}
            title="Sustainable Craft"
            description="We source responsibly — FSC-certified woods, natural fibres, and local artisans. Furniture that's good for your home and the planet."
          />
          <ValueCard 
            icon={<TbCube className="w-8 h-8" strokeWidth={1.5} />}
            title="Uncompromising Quality"
            description="Every piece passes a 23-point quality check before it reaches your home. We back it with a 5-year warranty."
          />
          <ValueCard 
            icon={<TbHeart className="w-8 h-8" strokeWidth={1.5} />}
            title="Design with Soul"
            description="We don't chase trends. We design furniture that ages gracefully and belongs in every chapter of your life."
          />
        </div>
      </div>

      {/* 5. OUR TEAM SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
        <div className="mb-8">
          <p className="text-[#A48669] text-[10px] font-bold tracking-[0.15em] uppercase mb-1">THE PEOPLE BEHIND NESTRO</p>
          <h2 className="text-2xl text-[#333333] font-medium">Our Team</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <TeamCard initials="AK" name="Aarav Kumar" role="Founder & CEO" />
          <TeamCard initials="SM" name="Sanya Mehta" role="Head of Design" />
          <TeamCard initials="VR" name="Vikram Rao" role="Chief Craftsman" />
          <TeamCard initials="PJ" name="Preet Joshi" role="Customer Experience" />
        </div>
      </div>

    </div>
  );
}