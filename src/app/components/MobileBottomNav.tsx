'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/storeHooks";
import { FaHome, FaBirthdayCake, FaShoppingBag, FaTelegramPlane, FaPhoneAlt } from "react-icons/fa";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartItems } = useAppSelector((state) => state.cart);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[#EFE7E2] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* 1. Bosh sahifa */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isActive("/") ? "text-rose-600 font-bold" : "text-[#7A635E] hover:text-rose-500"
          }`}
        >
          <FaHome className={`text-xl ${isActive("/") ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Asosiy</span>
        </Link>

        {/* 2. Menyu & Tortlar */}
        <Link
          href="/product"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isActive("/product") ? "text-rose-600 font-bold" : "text-[#7A635E] hover:text-rose-500"
          }`}
        >
          <FaBirthdayCake className={`text-xl ${isActive("/product") ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-1 tracking-tight">Katalog</span>
        </Link>

        {/* 3. Savatcha */}
        <Link
          href="/cart"
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isActive("/cart") ? "text-rose-600 font-bold" : "text-[#7A635E] hover:text-rose-500"
          }`}
        >
          <div className="relative">
            <FaShoppingBag className={`text-xl ${isActive("/cart") ? "scale-110" : ""}`} />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {totalQuantity}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Savatcha</span>
        </Link>

        {/* 4. Telegram */}
        <a
          href="https://t.me/evro_desert86bot"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[#0088cc] hover:text-sky-600 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center">
            <FaTelegramPlane className="text-sm" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight font-medium">Telegram</span>
        </a>

        {/* 5. Tezkor Qo'ng'iroq */}
        <a
          href="tel:+998903605903"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-600 hover:text-emerald-700 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <FaPhoneAlt className="text-xs" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight font-medium">Qo&apos;ng&apos;iroq</span>
        </a>

      </div>
    </div>
  );
}
