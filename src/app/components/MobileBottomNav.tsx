'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/storeHooks";
import { FaHome, FaBirthdayCake, FaShoppingBag, FaTelegramPlane, FaPhoneAlt, FaArrowRight } from "react-icons/fa";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartItems } = useAppSelector((state) => state.cart);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Floating Mini-Cart Checkout Pill (shown when cart has items and user is not on /cart) */}
      {totalQuantity > 0 && pathname !== "/cart" && (
        <div className="px-3 pb-2 pointer-events-auto">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-rose-900/20 border border-white/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-white text-rose-600 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                {totalQuantity}
              </span>
              <div className="text-left">
                <span className="text-xs font-extrabold block leading-tight">
                  Savatchaga o&apos;tish
                </span>
                <span className="text-[11px] text-rose-100 font-medium block leading-tight">
                  Jami: {totalAmount.toLocaleString("uz-UZ")} so&apos;m
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl">
              <span>Rasmiylashtirish</span>
              <FaArrowRight className="text-[10px]" />
            </div>
          </Link>
        </div>
      )}

      {/* Main Bottom Tab Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-[#EFE7E2] px-1.5 pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-pb pointer-events-auto">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          
          {/* 1. Bosh sahifa */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-95 ${
              isActive("/") ? "text-rose-600 font-bold" : "text-[#7A635E]"
            }`}
          >
            <FaHome className={`text-lg ${isActive("/") ? "scale-110 text-rose-600" : ""}`} />
            <span className="text-[10px] mt-1 tracking-tight">Asosiy</span>
          </Link>

          {/* 2. Menyu & Tortlar */}
          <Link
            href="/product"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-95 ${
              isActive("/product") ? "text-rose-600 font-bold" : "text-[#7A635E]"
            }`}
          >
            <FaBirthdayCake className={`text-lg ${isActive("/product") ? "scale-110 text-rose-600" : ""}`} />
            <span className="text-[10px] mt-1 tracking-tight">Katalog</span>
          </Link>

          {/* 3. Savatcha */}
          <Link
            href="/cart"
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-95 ${
              isActive("/cart") ? "text-rose-600 font-bold" : "text-[#7A635E]"
            }`}
          >
            <div className="relative">
              <FaShoppingBag className={`text-lg ${isActive("/cart") ? "scale-110 text-rose-600" : ""}`} />
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                  {totalQuantity}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Savatcha</span>
          </Link>

          {/* 4. Telegram Bot */}
          <a
            href="https://t.me/evro_desert86bot"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[#0088cc] active:scale-95 transition-all"
          >
            <FaTelegramPlane className="text-lg" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Buyurtmam</span>
          </a>

          {/* 5. Tezkor Qo'ng'iroq */}
          <a
            href="tel:+998903605903"
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-emerald-600 active:scale-95 transition-all"
          >
            <FaPhoneAlt className="text-base" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Aloqa</span>
          </a>

        </div>
      </nav>
    </div>
  );
}
