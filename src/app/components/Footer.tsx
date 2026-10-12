import Link from "next/link";
import { GiCupcake } from "react-icons/gi";
import { FaTelegramPlane, FaInstagram, FaPhoneAlt, FaMapMarkerAlt, FaClock } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#261C1A] text-[#F3EBE6] pt-14 pb-8 border-t border-[#3D2D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#3D2D2A]">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-luxury font-bold text-white tracking-wide">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg">
                <GiCupcake className="text-2xl" />
              </span>
              <span>EVRO DESERT</span>
            </Link>
            <p className="text-sm text-[#C8B8B0] leading-relaxed">
              Har bir lahzangizni unutilmas qiladigan shirin quvonch! Faqat 100% tabiiy va sifatli mahsulotlardan sevgi bilan tayyorlangan shirinliklar.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://t.me/evro_desert86bot"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-[#3B2C28] hover:bg-sky-500 flex items-center justify-center text-white transition-colors duration-200"
                title="Telegram (@evro_desert86bot)"
              >
                <FaTelegramPlane className="text-lg" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-[#3B2C28] hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 flex items-center justify-center text-white transition-colors duration-200"
                title="Instagram sahifamiz"
              >
                <FaInstagram className="text-lg" />
              </a>
              <a
                href="tel:+998903605903"
                className="w-10 h-10 rounded-full bg-[#3B2C28] hover:bg-emerald-600 flex items-center justify-center text-white transition-colors duration-200"
                title="Telefon orqali bog'lanish"
              >
                <FaPhoneAlt className="text-sm" />
              </a>
            </div>
          </div>

          {/* Sahifalar */}
          <div>
            <h3 className="text-base font-semibold text-white tracking-wider uppercase mb-4">
              Menyu & Sahifalar
            </h3>
            <ul className="space-y-2.5 text-sm text-[#C8B8B0]">
              <li>
                <Link href="/" className="hover:text-rose-400 transition-colors">
                  Bosh sahifa
                </Link>
              </li>
              <li>
                <Link href="/product" className="hover:text-rose-400 transition-colors">
                  Barcha tortlar & shirinliklar
                </Link>
              </li>
              <li>
                <Link href="/product?category=bento" className="hover:text-rose-400 transition-colors">
                  Bento mini-tortlar
                </Link>
              </li>
              <li>
                <Link href="/product?category=tortlar" className="hover:text-rose-400 transition-colors">
                  Tug&apos;ilgan kun & To&apos;y tortlari
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-rose-400 transition-colors">
                  Savatcha & Buyurtma
                </Link>
              </li>
            </ul>
          </div>

          {/* Afzalliklar / Xizmatlar */}
          <div>
            <h3 className="text-base font-semibold text-white tracking-wider uppercase mb-4">
              Xizmatlarimiz
            </h3>
            <ul className="space-y-2.5 text-sm text-[#C8B8B0]">
              <li>✨ Individual dizayndagi tortlar</li>
              <li>⚡ 2 soat ichida shoshilinch bento tort</li>
              <li>🚚 Qo&apos;qon bo&apos;ylab tezkor yetkazish</li>
              <li>💳 Click, Payme, Uzum va Naqd to&apos;lov</li>
              <li>🎉 Tadbir va bayramlar uchun catering</li>
            </ul>
          </div>

          {/* Bog'lanish */}
          <div>
            <h3 className="text-base font-semibold text-white tracking-wider uppercase mb-4">
              Bog&apos;lanish & Manzil
            </h3>
            <ul className="space-y-3 text-sm text-[#C8B8B0]">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-rose-400 mt-1 flex-shrink-0" />
                <span>Qo&apos;qon shahri</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhoneAlt className="text-rose-400 flex-shrink-0" />
                <a href="tel:+998903605903" className="hover:text-rose-400 transition">+998903605903</a>
              </li>
              <li className="flex items-center gap-3">
                <FaClock className="text-rose-400 flex-shrink-0" />
                <span>Har kuni: 09:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#9B8982] gap-4">
          <p>© {new Date().getFullYear()} EVRO DESERT. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#B8A69E]">To&apos;lov turlari:</span>
            <span className="px-2 py-1 bg-[#3A2C29] rounded text-white font-medium">Click</span>
            <span className="px-2 py-1 bg-[#3A2C29] rounded text-white font-medium">Payme</span>
            <span className="px-2 py-1 bg-[#3A2C29] rounded text-white font-medium">Uzum</span>
            <span className="px-2 py-1 bg-[#3A2C29] rounded text-white font-medium">Naqd</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
