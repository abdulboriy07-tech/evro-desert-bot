'use client';

import Image from "next/image";
import Link from "next/link";
import { FaShoppingBag, FaStar, FaShieldAlt, FaTruck, FaClock } from "react-icons/fa";

export default function Herosection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FAF8F5] pt-4 pb-8 sm:pt-10 sm:pb-16 lg:py-20">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-rose-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 sm:w-80 h-64 sm:h-80 bg-amber-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>✨ Qo&apos;qondagi eng mazali va sifatli tortlar</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-luxury text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#2E1D1A] tracking-tight leading-[1.2] sm:leading-[1.15]">
              Har bir lahzangizga <br />
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                Shirin Quvonch
              </span>{" "}
              ulashamiz!
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-lg text-[#5E4742] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Tug&apos;ilgan kun, to&apos;y va marosimlaringiz uchun tabiiy qaymoq va Belgiya shokoladidan tayyorlangan eksklyuziv tortlar. Shaxsiy tabrik yozuvi bilan 2 soat ichida tayyorlab yetkazamiz.
            </p>

            {/* CTA: Shirinlik xarid qilish */}
            <div className="flex items-center justify-center lg:justify-start pt-1 sm:pt-2">
              <Link
                href="/product"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-base px-8 py-4 rounded-2xl sm:rounded-full shadow-lg shadow-rose-200 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                <FaShoppingBag className="text-lg" />
                <span>Shirinlik xarid qilish</span>
                <span className="text-lg">🍰</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 sm:pt-6 border-t border-[#EAE1DA] grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="text-lg sm:text-2xl font-bold text-[#2E1D1A]">100%</div>
                <div className="text-[11px] sm:text-xs text-[#7A635E]">Tabiiy sifat</div>
              </div>
              <div className="text-center lg:text-left border-x border-[#EAE1DA] px-2">
                <div className="text-lg sm:text-2xl font-bold text-rose-600">2 soat</div>
                <div className="text-[11px] sm:text-xs text-[#7A635E]">Tezkor tayyorlash</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-lg sm:text-2xl font-bold text-[#2E1D1A]">4.9 ⭐</div>
                <div className="text-[11px] sm:text-xs text-[#7A635E]">5000+ mijoz</div>
              </div>
            </div>

          </div>

          {/* Right Visual Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative ring */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-tr from-rose-300 to-amber-200 rounded-[2.5rem] rotate-3 scale-95 opacity-60 filter blur-sm" />

              {/* Main Image Container — Clickable on Mobile & Desktop */}
              <Link
                href="/product"
                className="block relative bg-white p-2 sm:p-3 rounded-[1.75rem] sm:rounded-[2rem] shadow-xl sm:shadow-2xl border border-white/60 overflow-hidden active:scale-[0.99] transition-transform duration-300"
              >
                <div className="relative h-[230px] sm:h-[440px] w-full rounded-[1.4rem] sm:rounded-[1.6rem] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop"
                    alt="Premium Shokoladli va Rezavorli Tort"
                    fill
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Floating Price Tag */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-rose-100 flex items-center gap-1">
                    <span className="text-amber-500 font-bold text-xs">★</span>
                    <span className="text-[11px] font-bold text-rose-600">Bugungi Tanlov</span>
                  </div>

                  {/* Floating Bottom Card */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-luxury font-bold text-xs sm:text-sm text-[#2E1D1A] truncate">
                        Shokolad & Rezavorli Tort
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-[#6E5550] truncate">
                        Yangi uzilgan mevalar bilan
                      </p>
                    </div>
                    <span className="bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex-shrink-0">
                      Tanlash →
                    </span>
                  </div>
                </div>
              </Link>

            </div>
          </div>

        </div>
      </div>

      {/* Feature perks strip */}
      <div className="mt-6 sm:mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-3.5 sm:p-6 shadow-sm border border-[#EFE7E2] grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
              <FaClock />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A] truncate">2 soatda tayyor</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E] truncate">Bento va tortlar</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
              <FaShieldAlt />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A] truncate">100% Tabiiy</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E] truncate">Premium masalliq</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
              <FaTruck />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A] truncate">Maxsus kuryer</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E] truncate">Shakli buzilmaydi</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 p-1.5 sm:p-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
              <FaStar />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A] truncate">Bepul yozuv</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E] truncate">Istalgan tabrik</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}