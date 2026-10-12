'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { ProductType } from "@/Data";
import {
  FaTelegramPlane,
  FaCheckCircle,
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaPlus,
  FaMinus,
  FaShoppingBag,
  FaCheck,
  FaGift,
  FaTruck,
  FaStore,
  FaArrowLeft
} from "react-icons/fa";
import { useAppDispatch } from "@/hooks/storeHooks";
import { addToCart } from "@/redux/features/cart/cart";

interface OrderModalProps {
  product: ProductType;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TEXT_SUGGESTIONS = [
  "🎉 Tug'ilgan kuningiz bilan!",
  "💖 Happy Birthday!",
  "🌹 Onajonimga ehtirom bilan",
  "🎂 1 yosh muborak!",
];

export default function OrderModal({ product, isOpen, onClose }: OrderModalProps) {
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [selectedFilling, setSelectedFilling] = useState(
    product.fillings?.[0] || "Klassik krem-chiz"
  );
  const [customText, setCustomText] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  // Buyurtma formasi holati
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Majburiy mijoz ma'lumotlari
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+998 ");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [deliveryTime] = useState("Bugun (Tezkor 2 soat ichida)");

  // Status
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Sync state on product change
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedFilling(product.fillings?.[0] || "Klassik krem-chiz");
      setCustomText("");
      setShowCheckoutForm(false);
      setIsSuccess(false);
      setIsAddedToCart(false);
      setFormError("");
    }
  }, [product]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Price calculations
  const unitPrice = product.price;
  const totalPrice = unitPrice * quantity;
  const originalUnitPrice = Math.round(unitPrice * 1.22); // 22% discount representation
  const originalTotalPrice = originalUnitPrice * quantity;

  const formatPrice = (price: number) => {
    return price.toLocaleString("uz-UZ") + " so'm";
  };

  // Savatchaga qo'shish
  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        image: product.url,
        price: unitPrice,
        quantity: quantity,
        customizable: product.customizable,
        filling: selectedFilling,
        customText: customText.trim(),
      })
    );
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2500);
  };

  // BUYURTMANI TASDIQLASH VA TO'G'RIDAN-TO'G'RI TELEGRAM BOTGA O'TISH
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Majburiy tekshiruvlar:
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
          deliveryType: deliveryType,
          address: deliveryType === "pickup" ? "Do'kondan olib ketish" : address.trim(),
          deliveryTime: deliveryTime,
          product: product.name,
          quantity: quantity,
          price: totalPrice,
          filling: selectedFilling,
          customText: customText.trim(),
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

    // Botga yuboriladigan to'liq xabar
    const messageLines = [
      `🎂 Assalomu alaykum! EVRO DESERT buyurtmasi:`,
      orderCode ? `🆔 Buyurtma kodi: #ED-${orderCode}` : null,
      ``,
      `👤 *Mijoz:* ${customerName.trim()}`,
      `📞 *Telefon:* ${customerPhone.trim()}`,
      `🚚 *Qabul qilish usuli:* ${deliveryType === "pickup" ? "🏬 Olib ketish (Do'kondan)" : `🚚 Yetkazib berish (${address.trim()})`}`,
      `⏰ *Muddat:* ${deliveryTime}`,
      ``,
      `🍰 *Mahsulot:* ${product.name}`,
      product.fillings ? `🍓 *Nachinka:* ${selectedFilling}` : null,
      customText.trim() ? `✍️ *Tabrik yozuvi:* "${customText.trim()}"` : null,
      `🔢 *Soni:* ${quantity} dona`,
      `💰 *Jami summa:* ${formatPrice(totalPrice)}`,
      ``,
      `Iltimos, to'lov uchun karta raqamni yuboring!`
    ].filter(Boolean);

    const fullMessage = messageLines.join('\n');
    const message = encodeURIComponent(fullMessage);

    // Xabarni nusxalash
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(fullMessage);
      }
    } catch {}

    // To'g'ridan-to'g'ri Telegram botga o'tish (start parametri orqali to'lov tugmasi chiqishi uchun)
    const cleanPhone = (customerPhone.trim() || '').replace(/[^0-9]/g, '').slice(-9);
    const startCode = `ED${orderCode}_${Math.round(totalPrice / 1000)}k_${cleanPhone || '900000000'}_${deliveryType === 'pickup' ? 'P' : 'D'}`;
    const tgUrl = `https://t.me/evro_desert86bot?start=${startCode}&text=${message}`;

    const win = window.open(tgUrl, '_blank');
    if (!win) {
      window.location.href = tgUrl;
    }

    setIsSuccess(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-0 sm:my-6 max-h-[94vh] flex flex-col font-sans transition-all"
      >
        {/* Mobile Swipe Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {showCheckoutForm && !isSuccess && (
              <button
                onClick={() => setShowCheckoutForm(false)}
                className="mr-1 text-gray-500 hover:text-gray-900 p-1 -ml-1 transition"
                title="Orqaga"
              >
                <FaArrowLeft className="text-sm" />
              </button>
            )}
            <span className="text-xl">🎂</span>
            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
              EVRO DESERT • {showCheckoutForm ? "Buyurtmani rasmiylashtirish" : (product.category === 'bento' ? 'Bento' : 'Tortlar')}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
              <FaCheckCircle />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">
                Telegram botga o&apos;tildi! 📲
              </h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mt-2 leading-relaxed">
                Buyurtmangiz va ma&apos;lumotlaringiz Telegram botga yetkazildi. Botda <b>To&apos;lov qilish</b> tugmasini bosib, karta raqamni oling va chekni yuklang!
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Mijoz:</span>
                <span className="font-bold text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon:</span>
                <span className="font-semibold text-gray-800">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usul:</span>
                <span className="font-semibold text-gray-800">
                  {deliveryType === "pickup" ? "🏬 Do'kondan olib ketish" : `🚚 Yetkazib berish (${address})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mahsulot:</span>
                <span className="font-bold text-gray-900">{product.name} ({quantity} dona)</span>
              </div>
              {product.fillings && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nachinka:</span>
                  <span className="font-semibold text-gray-800">{selectedFilling}</span>
                </div>
              )}
              {customText && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tabrik yozuvi:</span>
                  <span className="italic text-gray-800">&quot;{customText}&quot;</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                <span className="text-gray-700 font-bold">Jami to&apos;lov:</span>
                <span className="font-extrabold text-[#7000FF]">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <a
                href="https://t.me/evro_desert86bot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#1E88E5] transition text-sm shadow-md shadow-sky-200"
              >
                <FaTelegramPlane className="text-base" />
                <span>Telegram botda ochish</span>
              </a>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-3 rounded-2xl transition text-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : showCheckoutForm ? (
          /* ------------------------------------------------------------- */
          /* BOSQICH 2: MIJOZ MA'LUMOTLARINI TO'LDIRISH OYNASI (CHECKOUT)   */
          /* ------------------------------------------------------------- */
          <form onSubmit={handleConfirmOrder} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#1F2026]">{product.name}</div>
                <div className="text-xs text-gray-500">{quantity} dona • {selectedFilling}</div>
              </div>
              <div className="text-right">
                <span className="font-black text-base text-[#7000FF]">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-shake">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* 1. Ism (Majburiy) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 flex items-center justify-between">
                  <span>Ismingiz: *</span>
                  <span className="text-[10px] text-gray-400 font-normal">Majburiy</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masalan: Dilshod"
                  className="w-full bg-[#F4F5F7] focus:bg-white border border-gray-200 focus:border-rose-500 text-sm rounded-xl px-3.5 py-2.5 outline-none font-medium transition"
                />
              </div>

              {/* 2. Telefon raqami (Majburiy) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 flex items-center justify-between">
                  <span>Telefon raqamingiz: *</span>
                  <span className="text-[10px] text-gray-400 font-normal">Majburiy</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-[#F4F5F7] focus:bg-white border border-gray-200 focus:border-rose-500 text-sm rounded-xl px-3.5 py-2.5 outline-none font-medium transition"
                />
              </div>

              {/* 3. Qabul qilish usuli: Yetkazib berish yoki Olib ketish */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800">
                  Qabul qilish usuli: *
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`py-3 px-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                      deliveryType === "delivery"
                        ? "bg-rose-50 border-rose-500 text-rose-900 font-bold ring-1 ring-rose-400"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaTruck className="text-base text-rose-600" />
                    <span className="text-xs">Yetkazib berish</span>
                    <span className="text-[10px] text-emerald-600 font-bold">100k dan yuqori bepul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`py-3 px-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                      deliveryType === "pickup"
                        ? "bg-rose-50 border-rose-500 text-rose-900 font-bold ring-1 ring-rose-400"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaStore className="text-base text-rose-600" />
                    <span className="text-xs">Olib ketish</span>
                    <span className="text-[10px] text-gray-500">Do&apos;kondan (Qo&apos;qon)</span>
                  </button>
                </div>
              </div>

              {/* 4. Manzil (Agar Yetkazib berish bo'lsa, majburiy) */}
              {deliveryType === "delivery" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="font-bold text-gray-800 flex items-center justify-between">
                    <span>Yetkazib berish manzili: *</span>
                    <span className="text-[10px] text-gray-400 font-normal">Qo&apos;qon shahri</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ko'cha, uy raqami, xonadon yoki mo'ljal"
                    className="w-full bg-[#F4F5F7] focus:bg-white border border-gray-200 focus:border-rose-500 text-sm rounded-xl px-3.5 py-2.5 outline-none font-medium transition"
                  />
                </div>
              )}

              {/* Muddat haqida eslatma */}
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 flex items-center justify-between">
                <span>⏰ Yetkazish / Tayyorlash muddati:</span>
                <span className="font-bold text-gray-900">Bugun (Tezkor 2 soat)</span>
              </div>
            </div>

            {/* Pastki Asosiy Tugma: Buyurtmani tasdiqlash */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Tayyorlanmoqda...</span>
                ) : (
                  <>
                    <span>Buyurtmani tasdiqlash</span>
                    <span>•</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-gray-400 mt-2">
                Tasdiqlashdan so&apos;ng to&apos;lov ma&apos;lumotlari Telegram botda taqdim etiladi
              </p>
            </div>
          </form>
        ) : (
          /* ------------------------------------------------------------- */
          /* BOSQICH 1: MAHSULOT SOZLAMALARI VA "XARID QILISH" TUGMASI      */
          /* ------------------------------------------------------------- */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Product Mini Preview */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                <Image
                  src={product.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Uzum-style Big Price Row */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-[#1F2026] tracking-tight">
                  {formatPrice(totalPrice)}
                </span>
                <span className="text-base sm:text-lg text-gray-400 line-through font-semibold">
                  {formatPrice(originalTotalPrice)}
                </span>
              </div>
            </div>

            {/* Nachinka ta'mi tanlash (if product has fillings) */}
            {product.fillings && product.fillings.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Nachinka ta&apos;mini tanlang:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {product.fillings.map((fill) => {
                    const isSelected = selectedFilling === fill;
                    return (
                      <button
                        type="button"
                        key={fill}
                        onClick={() => setSelectedFilling(fill)}
                        className={`p-2 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                          isSelected
                            ? "bg-rose-50 border-rose-500 text-rose-800 font-bold ring-1 ring-rose-400"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate pr-1 text-[11px]">{fill}</span>
                        {isSelected && <FaCheck className="text-rose-600 text-[10px] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Inscription on Cake */}
            {product.customizable && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Tort ustiga yozuv (ixtiyoriy):
                  </label>
                  <span className="text-[10px] text-gray-400">BEPUL</span>
                </div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Masalan: 'Tug'ilgan kuningiz bilan!'"
                  className="w-full bg-[#F4F5F7] border border-gray-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-gray-400 transition"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {QUICK_TEXT_SUGGESTIONS.map((text) => (
                    <button
                      type="button"
                      key={text}
                      onClick={() => setCustomText(text)}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full transition"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA BUTTONS: XARID QILISH + MIQDOR + SAVATGA */}
            <div className="space-y-2.5 pt-1">
              
              {/* Row 1: KATTA ASOSIY "Xarid qilish" TUGMASI + SEVIMLILAR */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(true)}
                  className="flex-1 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.98] text-white font-black py-4 px-5 rounded-2xl text-center text-base shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  <FaShoppingBag className="text-lg" />
                  <span>Xarid qilish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label="Sevimlilar"
                  className="w-14 h-14 bg-[#E8E9EC] hover:bg-[#DCDFE3] rounded-2xl flex items-center justify-center transition active:scale-95 flex-shrink-0"
                >
                  {isLiked ? (
                    <FaHeart className="text-rose-600 text-xl animate-scale" />
                  ) : (
                    <FaRegHeart className="text-gray-700 text-xl" />
                  )}
                </button>
              </div>

              {/* Row 2: Miqdor hisoblagichi [ - 1 + ] + Savatga qo'shish */}
              <div className="flex items-center gap-2">
                {/* Stepper Box */}
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-3 py-2.5 w-32 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition"
                  >
                    <FaMinus className="text-xs" />
                  </button>
                  <span className="font-bold text-gray-900 text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                </div>

                {/* Savatga Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                    isAddedToCart
                      ? "bg-emerald-600 text-white"
                      : "bg-[#ECE5FF] hover:bg-[#E0D4FF] text-[#7000FF]"
                  }`}
                >
                  <FaShoppingBag className="text-base" />
                  <span>{isAddedToCart ? "Savatga qo'shildi! ✓" : "Savatga qo'shish"}</span>
                </button>
              </div>

            </div>

            {/* Ishonch belgilari */}
            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#D4F4E2] text-emerald-700 flex items-center justify-center text-xs flex-shrink-0">
                  <FaCheck />
                </div>
                <span>100% tabiiy va yangi masalliqlar (Har kuni yangi pishiriladi)</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs flex-shrink-0">
                  <FaGift />
                </div>
                <span>Bayram shamchasi + maxsus sovg&apos;a qadoq BEPUL</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
