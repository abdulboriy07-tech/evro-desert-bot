'use client';

import { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Data, { CATEGORIES, ProductType } from "@/Data";
import OrderModal from "../components/OrderModal";
import { useAppDispatch } from "@/hooks/storeHooks";
import { addToCart } from "@/redux/features/cart/cart";
import { useToast } from "@/components/ui/use-toast";
import { FaShoppingCart, FaSearch, FaBolt, FaStar, FaSortAmountDown } from "react-icons/fa";

// Normalize text for flexible Uzbek searching (strips accents, apostrophes, extra spaces)
function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`'ʻ’‘ʼ]/g, "")
    .trim();
}

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "name_asc">("featured");
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Multi-criteria Filtering & Sorting Algorithm
  const filteredAndSortedProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    const filtered = Data.filter((product) => {
      // 1. Category filter
      const matchesCategory =
        activeCategory === "all" || product.category === activeCategory;
      if (!matchesCategory) return false;

      // 2. Search query filter
      if (!normalizedQuery) return true;

      const normName = normalizeSearchText(product.name);
      const normDesc = normalizeSearchText(product.description);
      const normIngr = normalizeSearchText(product.ingredients);

      return (
        normName.includes(normalizedQuery) ||
        normDesc.includes(normalizedQuery) ||
        normIngr.includes(normalizedQuery)
      );
    });

    // 3. Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "price_asc") {
        return a.price - b.price;
      }
      if (sortBy === "price_desc") {
        return b.price - a.price;
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name, "uz");
      }
      // "featured" default: keep original curated order
      return a.id - b.id;
    });
  }, [activeCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: ProductType, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultWeight = product.weightOptions ? product.weightOptions[0].label : undefined;
    const defaultPrice = product.price;

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        image: product.url,
        price: defaultPrice,
        quantity: 1,
        customizable: product.customizable,
        weight: defaultWeight,
      })
    );
    toast({
      title: "Savatchaga qo'shildi! 🛍️",
      description: `${product.name} savatchangizga muvaffaqiyatli joylandi.`,
    });
  };

  const handleOrderClick = (product: ProductType) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("uz-UZ") + " so'm";
  };

  return (
    <main className="min-h-screen py-10 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">
            🍰 Barcha Shirinliklar Katalogi
          </span>
          <h1 className="font-luxury text-3xl sm:text-5xl font-extrabold text-[#2E1D1A]">
            Eng Sara Tort va Shirinliklarimiz
          </h1>
          <p className="text-sm sm:text-base text-[#6E5550]">
            Faqat tabiiy masalliqlardan, sevgi bilan yangi pishirilgan mahsulotlar. Istalgan tortingizga o&apos;zingiz xohlagan tabrik yozuvini bepul yozdirishingiz mumkin!
          </p>
        </div>

        {/* Filter, Search, and Sort Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#EFE7E2] shadow-sm mb-10 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tort yoki shirinlik nomini qidiring (masalan: Red Velvet, Bento)..."
                className="w-full bg-[#FAF8F5] border border-gray-200 text-sm rounded-full pl-11 pr-4 py-3 focus:bg-white focus:border-rose-500 outline-none transition"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <FaSortAmountDown className="text-gray-400 text-sm hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto bg-[#FAF8F5] border border-gray-200 text-xs sm:text-sm rounded-full px-4 py-3 outline-none focus:border-rose-500 font-medium text-gray-700"
              >
                <option value="featured">✨ Tavsiya etilganlar</option>
                <option value="price_asc">📈 Narx: Arzondan qimmatga</option>
                <option value="price_desc">📉 Narx: Qimmatdan arzonga</option>
                <option value="name_asc">🔤 Nomi bo&apos;yicha (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs - Horizontally scrollable on mobile */}
          <div className="flex items-center sm:justify-center overflow-x-auto no-scrollbar gap-2 pt-2 pb-1 -mx-2 px-2 scroll-smooth">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-105"
                    : "bg-[#FAF8F5] text-[#5C4540] hover:bg-rose-50 hover:text-rose-600 border border-transparent"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Product Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-[#EFE7E2] hover:border-rose-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Product Image */}
                <div className="relative h-64 w-full overflow-hidden bg-[#FAF6F2]">
                  <Image
                    src={product.url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Badge */}
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

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#A88B84]">
                        {product.category === 'tortlar' ? 'Tort' : product.category === 'bento' ? 'Bento' : product.category === 'kapkeyk' ? 'Kapkeyk' : 'Desert'}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <FaStar />
                        <span>5.0</span>
                      </div>
                    </div>

                    <h3 className="font-luxury text-xl font-bold text-[#2E1D1A] group-hover:text-rose-600 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#6E5550] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="text-[11px] text-gray-500 bg-[#FAF8F5] p-2 rounded-lg">
                      <span className="font-semibold text-gray-700">Tarkibi:</span> {product.ingredients}
                    </div>
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
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#EFE7E2] max-w-md mx-auto space-y-4">
            <span className="text-4xl">🔍</span>
            <h3 className="font-luxury text-xl font-bold text-[#2E1D1A]">
              Mahsulot topilmadi
            </h3>
            <p className="text-sm text-[#7A635E]">
              &quot;{searchQuery}&quot; bo&apos;yicha hech narsa topilmadi. Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring yoki boshqa toifani tanlang.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="text-xs font-bold text-rose-600 underline"
            >
              Barcha mahsulotlarni ko&apos;rsatish
            </button>
          </div>
        )}

      </div>

      {/* Order Modal */}
      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}

export default function ProductCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center py-20 text-gray-400">Yuklanmoqda...</div>}>
      <ProductCatalogContent />
    </Suspense>
  );
}