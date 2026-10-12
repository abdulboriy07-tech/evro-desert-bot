'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Data, { ProductType } from "@/Data";
import OrderModal from "./OrderModal";
import { useAppDispatch } from "@/hooks/storeHooks";
import { addToCart } from "@/redux/features/cart/cart";
import { useToast } from "@/components/ui/use-toast";
import { FaShoppingCart, FaBolt, FaStar } from "react-icons/fa";

export default function Offer() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Top 6 bestsellers for the home page showcase
  const featuredProducts = Data.slice(0, 6);

  const handleOrderClick = (product: ProductType) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        image: product.url,
        price: product.price,
        quantity: 1,
        customizable: product.customizable,
        weight: product.weightOptions ? product.weightOptions[0].label : undefined,
      })
    );
    toast({
      title: "Savatchaga qo'shildi! 🛍️",
      description: `${product.name} savatingizga joylandi.`,
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("uz-UZ") + " so'm";
  };

  return (
    <section className="py-10 sm:py-16 bg-[#FAF8F5]" id="catalog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            🔥 Eng Ko&apos;p Sotilganlar
          </span>
          <h2 className="font-luxury text-2xl sm:text-4xl font-extrabold text-[#2E1D1A]">
            Mashhur Tort va Desertlarimiz
          </h2>
          <p className="text-xs sm:text-base text-[#6E5550]">
            Mijozlarimiz eng ko&apos;p tanlaydigan va mehr bilan tayyorlangan sara shirinliklar to&apos;plami.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleOrderClick(product)}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#EFE7E2] hover:border-rose-200 shadow-sm hover:shadow-xl active:scale-[0.99] transition-all duration-300 flex flex-col"
            >
              {/* Product Image Container */}
              <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-[#FAF6F2]">
                <Image
                  src={product.url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge Tag */}
                {product.badge && (
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-rose-600 shadow-md border border-rose-100">
                    {product.badge}
                  </div>
                )}

                {/* Prep time badge */}
                <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-medium text-white flex items-center gap-1">
                  <FaBolt className="text-amber-400 text-xs" />
                  <span>{product.prepTime}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#A88B84]">
                      {product.category === 'tortlar' ? 'Tort' : product.category === 'bento' ? 'Bento Tort' : 'Desert'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <FaStar />
                      <span>5.0</span>
                    </div>
                  </div>

                  <h3 className="font-luxury text-lg sm:text-xl font-bold text-[#2E1D1A] group-hover:text-rose-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-[#6E5550] line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price and Action Buttons */}
                <div className="pt-3 border-t border-[#F2ECE7] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 block">Narxi</span>
                    <span className="text-base sm:text-lg font-extrabold text-rose-600">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      aria-label="Savatga qo'shish"
                      title="Savatga qo'shish"
                      className="w-11 h-11 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors active:scale-95"
                    >
                      <FaShoppingCart className="text-base" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(product);
                      }}
                      className="h-11 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 rounded-xl shadow-md shadow-rose-200 transition-all active:scale-95 flex items-center justify-center"
                    >
                      Xarid qilish
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 sm:mt-12 text-center">
          <Link
            href="/product"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 font-bold px-8 py-3.5 rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-sm sm:text-base"
          >
            <span>Barcha shirinliklarni ko&apos;rish</span>
            <span>→</span>
          </Link>
        </div>

      </div>

      {/* Render Modal if selected */}
      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}