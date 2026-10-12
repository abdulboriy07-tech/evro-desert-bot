import SessionProvider from "@/app/components/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Providers } from "@/redux/Provider";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "EVRO DESERT — Nafis Tortlar va Shirinliklar do'koni",
  description: "Tug'ilgan kun, bayram va to'ylar uchun tabiiy masalliqlardan tayyorlangan eksklyuziv tortlar va shirinliklarga buyurtma berish.",
};

import MobileBottomNav from "./components/MobileBottomNav";

import { authOptions } from "@/lib/authOptions";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  return (
    <html lang="uz">
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D2424] antialiased pb-14 md:pb-0">
        <SessionProvider session={session}>
          <Providers>
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white text-xs sm:text-sm py-2 px-3 text-center font-medium shadow-sm">
              <span className="flex flex-col sm:inline-flex sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <span>🎂</span>
                  <span>Qo&apos;qon shaharida 100 ming so&apos;mdan yuqori buyurtmalarni <strong>bepul yetkazamiz!</strong></span>
                </span>
                <span className="hidden sm:inline mx-1">•</span>
                <span className="text-[11px] sm:text-xs">
                  Telefon: <a href="tel:+998903605903" className="underline font-bold hover:text-rose-100">+998903605903</a>
                </span>
              </span>
            </div>
            
            <Navbar />
            
            <div className="flex-1">
              {children}
            </div>

            <Footer />
            <MobileBottomNav />
            <Toaster />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
