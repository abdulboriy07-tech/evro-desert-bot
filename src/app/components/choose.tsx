'use client';

import { FaLeaf, FaClock, FaTruck, FaPenFancy, FaCreditCard, FaGift } from "react-icons/fa";

export default function Choose() {
  const features = [
    {
      id: 1,
      name: "100% Tabiiy Masalliqlar",
      icon: FaLeaf,
      color: "text-emerald-600 bg-emerald-50",
      text: "Faqat premium sariyog', Belgiya shokoladi, tabiiy qaymoq va yangi mevalar. Margarin va arzon kukunlardan butunlay voz kechganmiz."
    },
    {
      id: 2,
      name: "2 Soatda Tezkor Tayyorlash",
      icon: FaClock,
      color: "text-amber-600 bg-amber-50",
      text: "To'satdan bayram bo'lib qoldimi? Bento va tanlangan mashhur tortlarimizni 2 soat ichida pishirib yetkazib beramiz."
    },
    {
      id: 3,
      name: "Sovutgichli Yetkazish",
      icon: FaTruck,
      color: "text-sky-600 bg-sky-50",
      text: "Tort erib ketmasligi va shakli buzilmasligi uchun sovutgichli maxsus qutilarda ehtiyotkor kuryerlarimiz tomonidan yetkaziladi."
    },
    {
      id: 4,
      name: "Bepul Shaxsiy Yozuv",
      icon: FaPenFancy,
      color: "text-rose-600 bg-rose-50",
      text: "Tort ustiga yaqinlaringiz uchun istalgan ism, sana yoki samimiy tilaklarni mohir qandolatchilarimiz bepul yozib berishadi."
    },
    {
      id: 5,
      name: "Qulay To'lov Usullari",
      icon: FaCreditCard,
      color: "text-purple-600 bg-purple-50",
      text: "Click, Payme, Uzum orqali masofadan to'lang yoki buyurtmani qo'lingizga olgandan so'ng kuryerga to'lang."
    },
    {
      id: 6,
      name: "Sovg'abop Quti & Shamcha",
      icon: FaGift,
      color: "text-pink-600 bg-pink-50",
      text: "Har bir buyurtma hashamatli shaffof oynali quti, chiroyli atlas lenta va bayram shamchasi bilan sovg'a sifatida taqdim etiladi."
    }
  ];

  return (
    <section className="py-20 bg-white" id="why-us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            ⭐ Bizning Afzalliklarimiz
          </span>
          <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-[#2E1D1A]">
            Nega Aynan &quot;EVRO DESERT&quot;ni Tanlashadi?
          </h2>
          <p className="text-sm sm:text-base text-[#6E5550]">
            Biz shunchaki shirinlik sotmaymiz — sizning eng aziz xotiralaringiz va quvonchli bayramingizga lazzat bag&apos;ishlaymiz.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#EFE7E2] hover:border-rose-300 hover:shadow-lg transition-all duration-300 space-y-4"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${feature.color}`}>
                <feature.icon />
              </div>
              <h3 className="font-luxury text-xl font-bold text-[#2E1D1A]">
                {feature.name}
              </h3>
              <p className="text-sm text-[#6E5550] leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Satisfaction banner */}
        <div className="mt-10 sm:mt-16 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-luxury text-xl sm:text-3xl font-bold">
              Shaxsiy dizaynda maxsus tort xohlaysizmi?
            </h3>
            <p className="text-rose-100 text-sm sm:text-base max-w-xl">
              Pinterest yoki Instagramdan yoqtirgan rasmingizni yuboring — biz uni aynan o&apos;zidek qilib tayyorlab beramiz!
            </p>
          </div>
          <a
            href="https://t.me/evro_desert86bot"
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 bg-white hover:bg-rose-50 text-rose-600 font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Rasm yuborish (Telegram) 💬
          </a>
        </div>

      </div>
    </section>
  );
}