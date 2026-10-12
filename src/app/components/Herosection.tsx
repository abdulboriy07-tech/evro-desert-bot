'use client';

import Image from "next/image";
import Link from "next/link";
import { FaShoppingBag, FaStar, FaShieldAlt, FaTruck, FaClock } from "react-icons/fa";

export default function Herosection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FAF8F5] pt-6 pb-10 sm:pt-10 sm:pb-16 lg:py-20">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
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
            <p className="text-base sm:text-lg text-[#5E4742] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Tug&apos;ilgan kun, to&apos;y va marosimlaringiz uchun tabiiy qaymoq va Belgiya shokoladidan tayyorlangan eksklyuziv tortlar. Shaxsiy tabrik yozuvi va dizayningiz bilan 2 soat ichida tayyorlab yetkazamiz.
            </p>

            {/* CTA: Faqat Shirinlik xarid qilish */}
            <div className="flex items-center justify-center lg:justify-start pt-2">
              <Link
                href="/product"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-base px-9 py-4 rounded-full shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaShoppingBag className="text-lg" />
                <span>Shirinlik xarid qilish</span>
                <span className="text-lg">🍰</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-[#EAE1DA] grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-[#2E1D1A]">100%</div>
                <div className="text-xs text-[#7A635E]">Tabiiy masalliqlar</div>
              </div>
              <div className="text-center lg:text-left border-x border-[#EAE1DA] px-2">
                <div className="text-2xl font-bold text-rose-600">2 soat</div>
                <div className="text-xs text-[#7A635E]">Tezkor tayyorlash</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-[#2E1D1A]">4.9 ⭐</div>
                <div className="text-xs text-[#7A635E]">5000+ baholar</div>
              </div>
            </div>

          </div>

          {/* Right Visual Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-300 to-amber-200 rounded-[2.5rem] rotate-3 scale-95 opacity-60 filter blur-sm" />

              {/* Main Image Container */}
              <div className="relative bg-white p-2.5 sm:p-3 rounded-[2rem] shadow-2xl border border-white/60 overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="relative h-[280px] sm:h-[450px] w-full rounded-[1.6rem] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop"
                    alt="Premium Shokoladli va Rezavorli Tort"
                    fill
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Floating Price Tag */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-rose-100 flex items-center gap-1.5">
                    <span className="text-amber-500 font-bold">★</span>
                    <span className="text-xs font-bold text-rose-600">Bugungi Tanlov</span>
                  </div>

                  {/* Floating Bottom Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-white/80 flex items-center justify-between">
                    <div>
                      <h4 className="font-luxury font-bold text-sm text-[#2E1D1A]">
                        Shokolad & Rezavorli Tort
                      </h4>
                      <p className="text-[11px] text-[#6E5550]">
                        Yangi uzilgan mevalar bilan
                      </p>
                    </div>
                    <Link
                      href="/product"
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Buyurtma
                    </Link>
                  </div>
                </div>
              </div>

              {/* Floating review card */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-rose-100 items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
                  🍓
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#2E1D1A]">Eng yangi rezavorlar</div>
                  <div className="text-[11px] text-gray-500">Har kuni yangi partiya</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Feature perks strip */}
      <div className="mt-8 sm:mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[#EFE7E2] grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 p-2 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              <FaClock />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A]">2 soatda yetkazish</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E]">Bento va tayyor tortlar</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 p-2 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              <FaShieldAlt />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A]">100% Tabiiy sifat</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E]">Premium masalliqlar</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 p-2 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              <FaTruck />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A]">Sovutgichli kuryer</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E]">Shakli buzilmaydi</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 p-2 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
              <FaStar />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-[#2E1D1A]">Bepul tabrik yozuvi</h5>
              <p className="text-[10px] sm:text-xs text-[#7A635E]">Istalgan matn yoziladi</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}