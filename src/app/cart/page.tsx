'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/storeHooks";
import { increaseHandler, minusHandler, deleteHandler, updateCustomText, clearCart } from "@/redux/features/cart/cart";
import { FaTrash, FaPlus, FaMinus, FaTelegramPlane, FaCheckCircle, FaShoppingBag, FaArrowLeft } from "react-icons/fa";

export default function CartPage() {
  const { cartItems } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998 ");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("Bugun (Tezkor)");
  const [deliveryTime, setDeliveryTime] = useState("14:00 - 18:00");
  const [paymentMethod] = useState("Click / Payme");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<{
    itemsCount: number;
    total: number;
    customerName: string;
    deliveryType: string;
    telegramUrl: string;
  } | null>(null);

  // Subtotal & Delivery Fee Algorithm
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const FREE_DELIVERY_THRESHOLD = 100000;
  const STANDARD_DELIVERY_FEE = 15000;

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || deliveryType === "pickup";
  const deliveryFee = subtotal === 0 || isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryPercent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const formatPrice = (price: number) => {
    return price.toLocaleString("uz-UZ") + " so'm";
  };

  const handleTelegramCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");
    if (cartItems.length === 0) return;

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError("Iltimos, ismingizni kiriting!");
      return;
    }

    if (customerPhone.trim().replace(/[^0-9]/g, "").length < 9) {
      setFormError("Iltimos, telefon raqamingizni to'liq kiriting (+998 ...)");
      return;
    }

    if (deliveryType === "delivery" && (!address.trim() || address.trim().length < 3)) {
      setFormError("Iltimos, yetkazib berish manzilini kiriting!");
      return;
    }

    setIsSubmitting(true);
    let orderCode = "";
    try {
      const res = await fetch('/api/Order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          items: cartItems,
          subtotal,
          deliveryFee,
          total,
          deliveryType,
          address: deliveryType === "pickup" ? "Do'kondan olib ketish" : address.trim(),
          deliveryTime: `${deliveryDate} (${deliveryTime})`,
          paymentMethod,
        }),
      });
      const resData = await res.json();
      if (resData?.cleanCode) {
        orderCode = resData.cleanCode;
      }
    } catch {
      orderCode = Math.floor(100000 + Math.random() * 900000).toString();
    } finally {
      setIsSubmitting(false);
    }

    const itemsSummary = cartItems
      .map((item, idx) => {
        let line = `${idx + 1}. *${item.name}*`;
        if (item.weight) line += ` (${item.weight})`;
        if (item.filling) line += `\n   🍓 Nachinka: ${item.filling}`;
        if (item.customText?.trim()) line += `\n   ✍️ Tabrik yozuvi: "${item.customText.trim()}"`;
        line += `\n   🔢 ${item.quantity} dona x ${formatPrice(item.price)} = *${formatPrice(item.price * item.quantity)}*`;
        return line;
      })
      .join('\n\n');

    const messageLines = [
      `🎂 Assalomu alaykum! "EVRO DESERT" savatchasidagi mahsulotlarga buyurtma bermoqchiman:`,
      orderCode ? `🆔 Buyurtma kodi: #ED-${orderCode}` : null,
      ``,
      `📋 *Buyurtma tarkibi:*`,
      itemsSummary,
      ``,
      `-----------------------------`,
      `📦 *Mahsulotlar:* ${formatPrice(subtotal)}`,
      `🚚 *Yetkazish:* ${deliveryFee === 0 ? 'BEPUL 🎉' : formatPrice(deliveryFee)}`,
      `💰 *JAMI TO'LOV:* ${formatPrice(total)}`,
      `-----------------------------`,
      customerName.trim() ? `👤 *Ism:* ${customerName.trim()}` : null,
      customerPhone.trim().length > 5 ? `📞 *Telefon:* ${customerPhone.trim()}` : null,
      address.trim() ? `🏠 *Manzil:* ${address.trim()}` : null,
      ``,
      `Iltimos, yetkazib berish va qolgan barcha ma'lumotlarni qabul qiling!`
    ].filter(Boolean);

    const fullMessage = messageLines.join('\n');
    const message = encodeURIComponent(fullMessage);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(fullMessage);
      }
    } catch {}

    const cleanPhone = (customerPhone.trim() || '').replace(/[^0-9]/g, '').slice(-9);
    const startCode = `ED${orderCode}_${Math.round(total / 1000)}k_${cleanPhone || '900000000'}_${deliveryType === 'pickup' ? 'P' : 'D'}`;
    const tgUrl = `https://t.me/evro_desert86bot?start=${startCode}&text=${message}`;
    const win = window.open(tgUrl, '_blank');
    if (!win) {
      window.location.href = tgUrl;
    }
    setCompletedOrder({
      itemsCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      total,
      customerName: customerName.trim(),
      deliveryType,
      telegramUrl: tgUrl,
    });
    dispatch(clearCart());
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center py-10 sm:py-16 px-4 bg-[#FAF8F5]">
        <div className="bg-white p-6 sm:p-12 rounded-3xl border border-[#EFE7E2] shadow-xl max-w-lg w-full text-center space-y-5 sm:space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl shadow-sm">
            <FaCheckCircle />
          </div>
          <div>
            <h1 className="font-luxury text-2xl sm:text-3xl font-bold text-[#2E1D1A]">
              Buyurtmangiz Qabul Qilindi! 🎉
            </h1>
            <p className="text-xs sm:text-sm text-[#6E5550] leading-relaxed mt-2">
              Rahmat{completedOrder?.customerName || customerName ? `, ${completedOrder?.customerName || customerName}` : ""}! Buyurtmangiz Telegram botga uzatildi. Botda <b>To&apos;lov qilish</b> tugmasini bosib, chekni yuklang.
            </p>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE7E2] text-xs sm:text-sm text-left space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Mahsulotlar soni:</span>
              <span className="font-semibold">{completedOrder?.itemsCount || 1} dona</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Jami summa:</span>
              <span className="font-bold text-rose-600">{formatPrice(completedOrder?.total || total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Yetkazish:</span>
              <span className="font-medium text-emerald-700">
                {(completedOrder?.deliveryType || deliveryType) === "pickup" ? "Do'kondan olib ketish" : "Qo'qon bo'ylab yetkazish"}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
            <a
              href={completedOrder?.telegramUrl || "https://t.me/evro_desert86bot"}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold px-6 py-3.5 rounded-full active:scale-95 transition text-sm shadow-md shadow-sky-200"
            >
              <FaTelegramPlane />
              <span>Telegram botda ochish</span>
            </a>
            <Link
              href="/product"
              onClick={() => dispatch(clearCart())}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3.5 rounded-full shadow-md shadow-rose-200 active:scale-95 transition text-sm"
            >
              <span>Katalogga qaytish</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6 sm:py-10 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header — Back button visible on both Mobile and Desktop */}
        <div className="flex items-center justify-between gap-3 pb-5 sm:pb-6 mb-6 sm:mb-8 border-b border-[#EFE7E2]">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="font-luxury text-xl sm:text-4xl font-extrabold text-[#2E1D1A]">
              Sizning Savatchangiz 🛍️
            </h1>
            <p className="text-xs sm:text-sm text-[#7A635E]">
              Tanlangan mahsulotlarni tekshiring va buyurtmani rasmiylashtiring.
            </p>
          </div>

          <Link
            href="/product"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-full active:scale-95 transition flex-shrink-0"
          >
            <FaArrowLeft className="text-[10px]" />
            <span>Katalog</span>
          </Link>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Left Cart Items List */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">

              {/* Free Delivery Gamified Progress Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  {freeDeliveryRemaining > 0 ? (
                    <span className="text-[#6E5550]">
                      Yana <strong className="text-rose-600 font-bold">{formatPrice(freeDeliveryRemaining)}</strong> xarid qiling va Qo&apos;qon bo&apos;ylab yetkazish <strong className="text-emerald-700">BEPUL</strong> bo&apos;ladi!
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                      🎉 Tabriklaymiz! Sizga Qo&apos;qon shahrida yetkazib berish BEPUL!
                    </span>
                  )}
                  <span className="text-rose-600 font-bold flex-shrink-0">{freeDeliveryPercent}%</span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${freeDeliveryPercent}%` }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              {cartItems.map((item, index) => (
                <div
                  key={item.cartItemId || `${item.name}-${item.weight}-${index}`}
                  className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#EFE7E2] shadow-sm flex flex-col gap-3 transition-all hover:border-rose-200"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Photo & Info */}
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-luxury font-bold text-base sm:text-lg text-[#2E1D1A] truncate">
                          {item.name}
                        </h3>
                        {item.weight && (
                          <span className="text-xs text-[#7A635E] block font-medium">
                            ⚖️ Vazni: {item.weight}
                          </span>
                        )}
                        {item.filling && (
                          <span className="text-xs text-rose-700 block font-medium truncate">
                            🍓 Nachinka: {item.filling}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-rose-600 mt-0.5 block">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete — Touch-friendly 36px buttons on mobile */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-[#FAF8F5]">
                        <button
                          type="button"
                          onClick={() => dispatch(minusHandler({ cartItemId: item.cartItemId, name: item.name, weight: item.weight }))}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-white hover:text-rose-600 transition"
                          title="Kamaytirish"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="px-3 text-sm font-bold text-[#2E1D1A]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(increaseHandler({ cartItemId: item.cartItemId, name: item.name, weight: item.weight }))}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-white hover:text-rose-600 transition"
                          title="Ko'paytirish"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#2E1D1A] block">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatch(deleteHandler({ cartItemId: item.cartItemId, name: item.name, weight: item.weight }))}
                        className="w-9 h-9 rounded-xl bg-red-50/70 text-red-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center active:scale-95 transition"
                        title="O'chirish"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Inscription if customizable */}
                  {item.customizable && (
                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        ✍️ Tort ustiga yoziladigan matn (bepul):
                      </label>
                      <input
                        type="text"
                        placeholder="Masalan: 'Tug'ilgan kuningiz bilan, Azizim!'"
                        value={item.customText || ""}
                        onChange={(e) =>
                          dispatch(
                            updateCustomText({
                              cartItemId: item.cartItemId,
                              name: item.name,
                              text: e.target.value,
                            })
                          )
                        }
                        className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-400 focus:bg-white transition"
                      />
                    </div>
                  )}

                </div>
              ))}

              {/* Free Gifts Banner */}
              <div className="p-3.5 sm:p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
                <span className="text-2xl flex-shrink-0">🎁</span>
                <div>
                  <strong className="font-bold text-amber-950">Har bir buyurtmaga bepul qo&apos;shiladi:</strong>
                  <div className="text-amber-800 mt-0.5">
                    Bayramona shamchalar 🕯️ + Maxsus tort pichog&apos;i 🔪 + Chiroyli sovg&apos;abop qadoq 🎀
                  </div>
                </div>
              </div>

            </div>

            {/* Right Order & Checkout Box */}
            <div className="lg:col-span-5" id="checkout-form">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#EFE7E2] shadow-sm space-y-4 sm:space-y-5">
                
                <h2 className="font-luxury text-xl font-bold text-[#2E1D1A] pb-3 border-b border-[#EFE7E2]">
                  Buyurtmani Rasmiylashtirish
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6E5550]">
                    <span>Mahsulotlar summasi:</span>
                    <span className="font-semibold text-[#2E1D1A]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6E5550]">
                    <span>Yetkazib berish:</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                          BEPUL 🎉
                        </span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#EFE7E2] flex justify-between text-base font-bold text-[#2E1D1A]">
                    <span>Jami to&apos;lov:</span>
                    <span className="text-xl text-rose-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout Inputs */}
                <form onSubmit={handleTelegramCheckout} className="space-y-3.5 sm:space-y-4 pt-1">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                      ⚠️ {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#5C4540] uppercase tracking-wider mb-1">
                      Ismingiz*
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ismingizni kiriting"
                      className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:border-rose-500 focus:bg-white outline-none"
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
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:border-rose-500 focus:bg-white outline-none font-medium"
                    />
                  </div>

                  {/* Delivery type */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition ${
                        deliveryType === 'delivery'
                          ? "bg-rose-50 border-rose-600 text-rose-700 shadow-sm ring-1 ring-rose-300"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      <span>🚚 Yetkazib berish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition ${
                        deliveryType === 'pickup'
                          ? "bg-rose-50 border-rose-600 text-rose-700 shadow-sm ring-1 ring-rose-300"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      <span>🏬 Olib ketish</span>
                    </button>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div>
                      <label className="block text-xs font-bold text-[#5C4540] uppercase tracking-wider mb-1">
                        Manzilingiz*
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="street-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Qo'qon shahar, ko'cha, uy raqami"
                        className="w-full bg-[#FAF8F5] border border-gray-200 text-base sm:text-sm rounded-xl px-4 py-3 focus:border-rose-500 focus:bg-white outline-none"
                      />
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block font-bold text-[#5C4540] mb-1">Sana:</label>
                      <select
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2.5 outline-none text-base sm:text-xs font-medium"
                      >
                        <option value="Bugun (Tezkor)">Bugun (Tezkor)</option>
                        <option value="Ertaga">Ertaga</option>
                        <option value="Indinga">Indinga</option>
                        <option value="Boshqa sana">Boshqa sana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#5C4540] mb-1">Vaqt:</label>
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2.5 outline-none text-base sm:text-xs font-medium"
                      >
                        <option value="10:00 - 13:00">10:00 - 13:00</option>
                        <option value="14:00 - 18:00">14:00 - 18:00</option>
                        <option value="18:00 - 21:00">18:00 - 21:00</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.98] text-white font-extrabold py-4 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all text-sm sm:text-base disabled:opacity-50"
                    >
                      <FaCheckCircle className="text-base" />
                      <span>{isSubmitting ? "Tayyorlanmoqda..." : `Buyurtmani tasdiqlash (${formatPrice(total)})`}</span>
                    </button>
                    <p className="text-[11px] text-center text-gray-400 mt-2">
                      Tasdiqlashdan so&apos;ng to&apos;lov ma&apos;lumotlari Telegram botda taqdim etiladi
                    </p>
                  </div>
                </form>

              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#EFE7E2] max-w-md mx-auto space-y-5">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              <FaShoppingBag />
            </div>
            <h2 className="font-luxury text-2xl font-bold text-[#2E1D1A]">
              Savatchangiz hozircha bo&apos;sh
            </h2>
            <p className="text-xs sm:text-sm text-[#7A635E] leading-relaxed">
              Katalogimizdan o&apos;zingizga yoqqan lazzatli tort yoki shirinliklarni tanlab, savatga qo&apos;shing!
            </p>
            <div>
              <Link
                href="/product"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-rose-200 active:scale-95 transition text-sm"
              >
                <span>Tortlar Katalogiga O&apos;tish</span>
                <span>🎂</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}