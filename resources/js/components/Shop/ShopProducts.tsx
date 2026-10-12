"use client";

import React, { memo, useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { Product } from "@/types/products";
import ProductBuyRow from "@/components/ProductBuyRow";
import FavoriteButton from "@/components/FavoriteButton";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Two rows on large screens (4 cols × 2 = 8); fewer on smaller breakpoints. */
const PREVIEW_LIMIT = 8;
const PLACEHOLDER = "/placeholder.jpg";

const ease = [0.25, 0.1, 0.25, 1] as const;
const headerViewport = { once: true, margin: "-80px" } as const;
const cardViewport = { once: true, margin: "-60px" } as const;

const ProductCard = memo(function ProductCard({
  product,
  index,
  formatPrice,
}: {
  product: Product;
  index: number;
  formatPrice: (price: number) => string;
}) {
  const images = useMemo(() => {
    const arr = (product.images ?? []).filter(Boolean);
    if (arr.length > 0) return arr;
    const one = product.image_url ?? PLACEHOLDER;
    return [one];
  }, [product.images, product.image_url]);

  const [imgIndex, setImgIndex] = useState(0);
  const hasGallery = images.length > 1;
  const currentSrc = images[Math.min(imgIndex, images.length - 1)] ?? PLACEHOLDER;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasGallery) return;
    setImgIndex((v) => (v - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasGallery) return;
    setImgIndex((v) => (v + 1) % images.length);
  };

  return (
    <motion.div
      className="card-boutique overflow-hidden flex flex-col hover:shadow-soft group relative"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={cardViewport}
      transition={{
        duration: 0.4,
        ease,
        delay: Math.min(index, 12) * 0.06,
      }}
    >
      <Link href={`/product/${product.slug ?? product.id}`} className="relative block">
        {product.is_on_sale && (product.discount_percentage ?? 0) > 0 && (
          <span className="absolute start-2 top-2 z-20 rounded-xl bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground shadow-card">
            -{product.discount_percentage}%
          </span>
        )}

        <img
          src={currentSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="media-frame aspect-[3/4] w-full bg-[#f4f1ea] object-contain p-1 transition-transform duration-300 group-hover:scale-[1.02] sm:p-2"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.src = PLACEHOLDER;
          }}
        />

        {hasGallery && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute start-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-gray-900 shadow ring-1 ring-black/5 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute end-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-gray-900 shadow ring-1 ring-black/5 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </>
        )}
      </Link>

      <div className="absolute end-3 top-3 z-10">
        <FavoriteButton
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url ?? "",
            description: product.description ?? "",
            category: product.category ?? "",
            slug: product.slug,
          }}
          variant="icon"
          className="rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 hover:bg-white"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/product/${product.slug ?? product.id}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-primary transition-colors duration-200 group-hover:text-brand-dark sm:line-clamp-1 sm:text-lg">
            {product.name}
          </h3>
        </Link>
        <p className="mb-3 line-clamp-2 text-start text-sm text-brand-muted">{product.description}</p>

        <div className="mt-auto space-y-3">
          <div className="flex flex-col gap-0.5">
            {product.is_on_sale &&
              product.original_display_price != null &&
              product.original_display_price > product.price && (
                <span className="text-sm text-brand-muted line-through">
                  {formatPrice(product.original_display_price)}
                </span>
              )}
            <span className="text-lg text-price">{formatPrice(product.price)}</span>
          </div>

          <ProductBuyRow
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image_url ?? "",
              description: product.description ?? "",
              stock: product.stock,
              in_stock: product.in_stock,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
});

function ShopProductsInner({ products }: { products: Product[] | { data: Product[] } }) {
  const { t, formatPrice } = useI18n();
  const productList: Product[] = Array.isArray(products) ? products : products?.data || [];
  const preview = productList.slice(0, PREVIEW_LIMIT);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:py-5">
      <motion.div
        className="mb-4 text-center sm:mb-5 sm:text-start"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={headerViewport}
        transition={{ duration: 0.4, ease }}
      >
        <h2 className="text-2xl font-bold text-primary sm:text-3xl md:text-4xl">{t("Featured products")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-muted sm:mx-0 sm:text-base">
          {t("Featured products subtitle")}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {preview.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} formatPrice={formatPrice} />
        ))}
      </div>

      <motion.div
        className="mt-6 flex justify-center md:mt-8"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={headerViewport}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
      >
        <Link
          href="/products"
          className="inline-flex w-full max-w-sm touch-manipulation items-center justify-center rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto sm:max-w-none sm:px-8"
        >
          {t("View all products")}
        </Link>
      </motion.div>
    </div>
  );
}

const ShopProducts = memo(ShopProductsInner);
export default ShopProducts;
