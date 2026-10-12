'use client';

import { useState } from "react";
import { FaPhoneAlt, FaTelegramPlane, FaInstagram, FaMapMarkerAlt, FaClock, FaCheckCircle } from "react-icons/fa";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || phone.replace(/[^0-9]/g, "").length < 9) {
      setFormError("Iltimos, ismingiz va telefon raqamingizni to'liq kiriting!");
      return;
    }
    setSubmitted(true);
  };

  const handleTelegramChat = () => {
    const text = encodeURIComponent(
      `Assalomu alaykum! Men "EVRO DESERT" saytidan yozyapman.\n\nIsmim: ${name || "Mijoz"}\nTelefon: ${phone || "Ko'rsatilmadi"}\nXabar: ${message || "Tortlar bo'yicha maslahat olmoqchi edim."}`
    );
    const tgUrl = `https://t.me/evro_desert86bot?text=${text}`;
    const win = window.open(tgUrl, '_blank');
    if (!win) {
      window.location.href = tgUrl;
    }
  };

  return (
    <section className="py-12 sm:py-20 bg-[#FAF8F5]" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 space-y-2.5 sm:space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            📞 Bog&apos;lanish
          </span>
          <h2 className="font-luxury text-2xl sm:text-4xl font-extrabold text-[#2E1D1A]">
            Savollaringiz Bormi? Biz Yordam Beramiz!
          </h2>
          <p className="text-xs sm:text-base text-[#6E5550]">
            Tort dizayni, yetkazib berish yoki maxsus buyurtmalar bo&apos;yicha istalgan vaqtda murojaat qiling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#EFE7E2] shadow-sm space-y-5">
              <h3 className="font-luxury text-lg sm:text-xl font-bold text-[#2E1D1A]">
                Do&apos;kon Ma&apos;lumotlari
              </h3>

              <div className="space-y-4 text-sm text-[#5E4742]">
                <a
                  href="tel:+998903605903"
                  className="flex items-center gap-3.5 p-2.5 -mx-2.5 rounded-xl hover:bg-rose-50/50 active:bg-rose-50 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base flex-shrink-0">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-500">Telefon raqam (Bosib qo&apos;ng&apos;iroq qiling)</div>
                    <div className="text-rose-600 font-bold text-base">
                      +998 (90) 360-59-03
                    </div>
                  </div>
                </a>

                <a
                  href="https://t.me/evro_desert86bot"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 p-2.5 -mx-2.5 rounded-xl hover:bg-sky-50/50 active:bg-sky-50 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-base flex-shrink-0">
                    <FaTelegramPlane />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-500">Telegram bot</div>
                    <div className="text-sky-600 font-bold text-base">
                      @evro_desert86bot
                    </div>
                  </div>
                </a>

                <a
                  href="https://instagram.com/evro_dessert81"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 p-2.5 -mx-2.5 rounded-xl hover:bg-pink-50/50 active:bg-pink-50 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-base flex-shrink-0">
                    <FaInstagram />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-500">Instagram sahifa</div>
                    <div className="text-pink-600 font-bold text-base">
                      @evro_dessert81
                    </div>
                  </div>
                </a>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base flex-shrink-0">
                    <FaClock />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-500">Ish vaqti</div>
                    <p className="text-[#2E1D1A] font-medium text-xs sm:text-sm">Har kuni 09:00 — 22:00</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base flex-shrink-0">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-500">Manzilimiz</div>
                    <p className="text-[#2E1D1A] font-medium text-xs sm:text-sm">Qo&apos;qon shahri</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#EFE7E2] shadow-sm">
              {submitted ? (
                <div className="text-center py-8 sm:py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                    <FaCheckCircle />
                  </div>
                  <h3 className="font-luxury text-2xl font-bold text-[#2E1D1A]">
                    Xabaringiz qabul qilindi!
                  </h3>
                  <p className="text-[#6E5550] text-xs sm:text-sm max-w-md mx-auto">
                    Konditer administratorimiz tez orada siz bilan bog&apos;lanadi. Shoshilinch bo&apos;lsa, to&apos;g&apos;ridan-to&apos;g&apos;ri qo&apos;ng&apos;iroq qilishingiz mumkin.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-rose-600 font-semibold text-sm hover:underline pt-2"
                  >
                    Yana xabar yuborish
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-luxury text-lg sm:text-xl font-bold text-[#2E1D1A]">
                    Tezkor savol yoki taklif qoldirish
                  </h3>
                  <p className="text-xs text-[#7A635E]">
                    Quyidagi formani to&apos;ldiring yoki to&apos;g&apos;ridan-to&apos;g&apos;ri Telegram orqali yozing.
                  </p>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                      ⚠️ {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-[#5C4540] uppercase tracking-wider mb-1">
                        Ismingiz*
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ismingizni kiriting"
                        className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:bg-white focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5C4540] uppercase tracking-wider mb-1">
                        Telefon raqamingiz*
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 (90) 360-59-03"
                        className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:bg-white focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5C4540] uppercase tracking-wider mb-1">
                      Xabaringiz yoki tort talablari
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Qanday tort qidiryapsiz? Sana, necha kishilik..."
                      className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:bg-white focus:border-rose-500 outline-none resize-none"
                    />
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-rose-200 transition-all active:scale-[0.98] text-sm"
                    >
                      Xabarni yuborish
                    </button>
                    <button
                      type="button"
                      onClick={handleTelegramChat}
                      className="flex-1 bg-sky-50 hover:bg-sky-100 text-[#0088cc] border border-sky-200 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
                    >
                      <FaTelegramPlane className="text-lg" />
                      <span>Telegramda yozish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}