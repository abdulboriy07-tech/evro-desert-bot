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
    <section className="py-16 bg-[#FAF8F5]" id="catalog">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            🔥 Eng Ko&apos;p Sotilganlar
          </span>
          <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-[#2E1D1A]">
            Mashhur Tort va Desertlarimiz
          </h2>
          <p className="text-sm sm:text-base text-[#6E5550]">
            Mijozlarimiz eng ko&apos;p tanlaydigan va mehr bilan tayyorlangan sara shirinliklar to&apos;plami.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#EFE7E2] hover:border-rose-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Product Image Container */}
              <div className="relative h-64 w-full overflow-hidden bg-[#FAF6F2]">
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
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-medium text-white flex items-center gap-1">
                  <FaBolt className="text-amber-400 text-xs" />
                  <span>{product.prepTime}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#A88B84]">
                      {product.category === 'tortlar' ? 'Tort' : product.category === 'bento' ? 'Bento Tort' : 'Desert'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <FaStar />
                      <span>5.0</span>
                    </div>
                  </div>

                  <h3 className="font-luxury text-xl font-bold text-[#2E1D1A] group-hover:text-rose-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-[#6E5550] line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price and Action Buttons */}
                <div className="pt-3 border-t border-[#F2ECE7] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Boshlang&apos;ich narx</span>
                    <span className="text-lg font-extrabold text-rose-600">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      title="Savatga qo'shish"
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors active:scale-95"
                    >
                      <FaShoppingCart className="text-base" />
                    </button>
                    
                    <button
                      onClick={() => handleOrderClick(product)}
                      className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-200 transition-all active:scale-95"
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
        <div className="mt-12 text-center">
          <Link
            href="/product"
            className="inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 font-bold px-8 py-3.5 rounded-full shadow-sm hover:shadow transition-all"
          >
            <span>Barcha 50+ xil tortlarni ko&apos;rish</span>
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