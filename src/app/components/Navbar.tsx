'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppSelector } from "@/hooks/storeHooks";
import { GiCupcake } from "react-icons/gi";
import { CiShoppingCart } from "react-icons/ci";
import { FaTelegramPlane, FaPhoneAlt, FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems } = useAppSelector((state) => state.cart);

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EFE7E2] shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-500 text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform duration-300">
              <GiCupcake className="text-2xl" />
            </span>
            <div className="flex flex-col">
              <span className="font-luxury text-2xl font-bold text-[#3B2522] tracking-tight group-hover:text-rose-600 transition-colors">
                EVRO DESERT
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#9C7A74] font-medium -mt-1">
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

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Direct Call / Telegram */}
            <a
              href="https://t.me/evro_desert86bot"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#0088cc] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2 rounded-full transition-all"
            >
              <FaTelegramPlane className="text-sm" />
              <span>@evro_desert86bot</span>
            </a>

            {/* Cart Button */}
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

          {/* Mobile Menu & Cart Icon */}
          <div className="flex sm:hidden items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2.5 text-[#3B2522] bg-rose-50 rounded-full"
            >
              <CiShoppingCart className="text-2xl" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#3B2522] hover:text-rose-600 focus:outline-none"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-[#EFE7E2] px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.href)
                  ? "bg-rose-50 text-rose-600 font-semibold"
                  : "text-[#4A3835] hover:bg-[#FAF8F5]"
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-3 border-t border-[#EFE7E2] flex flex-col gap-2.5">
            <a
              href="https://t.me/evro_desert86bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-sky-50 text-sky-700 font-medium text-sm border border-sky-200"
            >
              <FaTelegramPlane className="text-base" />
              <span>Telegram (@evro_desert86bot)</span>
            </a>
            <a
              href="tel:+998903605903"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-200"
            >
              <FaPhoneAlt className="text-xs" />
              <span>+998 (90) 360-59-03</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}