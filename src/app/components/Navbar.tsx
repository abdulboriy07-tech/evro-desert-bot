'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/storeHooks";
import { GiCupcake } from "react-icons/gi";
import { CiShoppingCart } from "react-icons/ci";
import { FaTelegramPlane, FaPhoneAlt, FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems } = useAppSelector((state) => state.cart);

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Close mobile menu automatically when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Bosh sahifa", href: "/" },
    { name: "Tortlar & Menyu", href: "/product" },
    { name: "Nega biz?", href: "/#why-us" },
    { name: "Bog'lanish", href: "/#contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE7E2] shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <span className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-500 text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform duration-300">
                <GiCupcake className="text-xl sm:text-2xl" />
              </span>
              <div className="flex flex-col">
                <span className="font-luxury text-lg sm:text-2xl font-bold text-[#3B2522] tracking-tight group-hover:text-rose-600 transition-colors leading-tight">
                  EVRO DESERT
                </span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#9C7A74] font-medium -mt-0.5">
                  Konditer Uyi
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors duration-200 py-1.5 border-b-2 ${
                    isActive(link.href)
                      ? "text-rose-600 border-rose-600"
                      : "text-[#5C4540] border-transparent hover:text-rose-600 hover:border-rose-300"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Right Action Buttons */}
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="https://t.me/evro_desert86bot"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#0088cc] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2 rounded-full transition-all"
              >
                <FaTelegramPlane className="text-sm" />
                <span>@evro_desert86bot</span>
              </a>

              <Link
                href="/cart"
                className="relative flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-sm px-5 py-2.5 rounded-full shadow-md shadow-rose-200 transition-all transform active:scale-95"
              >
                <CiShoppingCart className="text-xl stroke-[1.5]" />
                <span>Savatcha</span>
                {totalQuantity > 0 && (
                  <span className="ml-1 bg-white text-rose-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-inner animate-pulse">
                    {totalQuantity}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Quick Actions (Call + Cart + Hamburger) */}
            <div className="flex sm:hidden items-center gap-2">
              <a
                href="tel:+998903605903"
                aria-label="Qo'ng'iroq qilish"
                className="w-10 h-10 flex items-center justify-center text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full active:scale-95 transition"
              >
                <FaPhoneAlt className="text-sm" />
              </a>

              <Link
                href="/cart"
                aria-label="Savatcha"
                className="relative w-10 h-10 flex items-center justify-center text-[#3B2522] bg-rose-50 border border-rose-100 rounded-full active:scale-95 transition"
              >
                <CiShoppingCart className="text-2xl stroke-[1]" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalQuantity}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center text-[#3B2522] hover:text-rose-600 rounded-full active:bg-gray-100 focus:outline-none transition"
                aria-label="Menyu"
              >
                {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-[#EFE7E2] px-4 pt-2 pb-5 space-y-2 shadow-xl relative z-50">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition ${
                  isActive(link.href)
                    ? "bg-rose-50 text-rose-600 font-bold"
                    : "text-[#4A3835] active:bg-[#FAF8F5]"
                }`}
              >
                <span>{link.name}</span>
                <span className="text-xs text-gray-400">→</span>
              </Link>
            ))}

            <div className="pt-3 border-t border-[#EFE7E2] grid grid-cols-2 gap-2.5">
              <a
                href="https://t.me/evro_desert86bot"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-200 active:scale-95 transition"
              >
                <FaTelegramPlane className="text-base" />
                <span>Telegram Bot</span>
              </a>
              <a
                href="tel:+998903605903"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 active:scale-95 transition"
              >
                <FaPhoneAlt className="text-xs" />
                <span>Qo&apos;ng&apos;iroq</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Click-outside Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] sm:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}