"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Star,
  Share2,
  ChevronRight,
} from "lucide-react";
import ShopFrontLayout from "@/layouts/shop-layout";
import { Product, ProductVariant } from "@/types/products";
import { Category } from "@/types/categories";
import { Link, useForm, usePage } from "@inertiajs/react";
import FavoriteButton from "@/components/FavoriteButton";
import ProductBuyRow from "@/components/ProductBuyRow";
import CheckoutForm from "@/components/Checkout/CheckoutForm";
import ShopSales from "@/components/Shop/ShopSales";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSaleCountdown } from "@/hooks/useSaleCountdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CartItem } from "@/contexts/cartContext";

type SaleProductCard = {
  id: number;
  name: string;
  slug: string;
  originalPrice: number;
  price: number;
  discountPercentage: number;
  description: string;
  image_url: string | null;
  category: string | null;
  rating: number;
  stock: number;
};

interface Props {
  product: Product;
  category: Category | null;
  saleProducts?: SaleProductCard[];
}

const placeholder = "https://via.placeholder.com/800?text=No+Image";

function variantMatchesSelection(
  variant: ProductVariant,
  selected: Record<number, number>,
): boolean {
  return Object.entries(selected).every(([attrId, valueId]) =>
    variant.options.some(
      (o) => o.attribute_id === Number(attrId) && o.value_id === valueId,
    ),
  );
}

export default function ProductDetail({ product, category, saleProducts = [] }: Props) {
  const { t, formatPrice, locale } = useI18n();
  const { flash, errors } = usePage().props as {
    flash?: { review_submitted?: boolean };
    errors?: { rating?: string };
  };
  const { auth } = usePage().props as { auth?: { user?: { id: number; name: string } | null } };
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});

  const hasVariants = Boolean(product.has_variants);
  const attributes = useMemo(() => product.attributes ?? [], [product.attributes]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) {
      return variants.find((v) => v.id === product.default_variant_id) ?? variants[0] ?? null;
    }
    if (attributes.length === 0) return null;
    if (attributes.some((a) => selectedOptions[a.id] == null)) return null;
    return variants.find((v) => variantMatchesSelection(v, selectedOptions)) ?? null;
  }, [hasVariants, attributes, selectedOptions, variants, product.default_variant_id]);

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const displayInStock = selectedVariant
    ? selectedVariant.in_stock && selectedVariant.stock > 0
    : product.in_stock;
  const displayOriginal =
    selectedVariant?.original_display_price ?? product.original_display_price;
  const displayOnSale = selectedVariant?.is_on_sale ?? product.is_on_sale;
  const displayDiscount =
    selectedVariant?.discount_percentage ?? product.discount_percentage;
  const saleEndsAt = selectedVariant?.sale_ends_at ?? product.sale_ends_at;
  const saleEndsLabel = useSaleCountdown(saleEndsAt);

  const selectionComplete =
    !hasVariants ||
    (attributes.length > 0 && attributes.every((a) => selectedOptions[a.id] != null));

  const canAddToCart =
    selectionComplete &&
    displayInStock &&
    (!hasVariants || selectedVariant != null);

  const isValueAvailable = (attributeId: number, valueId: number): boolean => {
    const trial = { ...selectedOptions, [attributeId]: valueId };
    return variants.some((v) => variantMatchesSelection(v, trial) && v.is_active !== false);
  };

  const selectOption = (attributeId: number, valueId: number) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [attributeId]: valueId };
      for (const attr of attributes) {
        if (attr.id === attributeId) continue;
        const current = next[attr.id];
        if (current == null) continue;
        if (!variants.some((v) => variantMatchesSelection(v, next))) {
          delete next[attr.id];
        }
      }
      return next;
    });
    setQuantity(1);
  };

  const reviewsList = product.reviews_list ?? [];
  const canReview = product.can_review === true;
  const userReview = product.user_review;

  const { data, setData, post, processing, reset } = useForm({
    rating: 5,
    body: "",
  });

  useEffect(() => {
    if (window.location.hash === "#reviews") {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (flash?.review_submitted) {
      reset();
    }
  }, [flash?.review_submitted, reset]);

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("shop.reviews.store", product.slug), { preserveScroll: true });
  };

  const baseImages = product.images && product.images.length > 0
    ? product.images.filter(Boolean)
    : [product.image_url || placeholder];

  const images =
    selectedVariant?.image_url && !baseImages.includes(selectedVariant.image_url)
      ? [selectedVariant.image_url, ...baseImages]
      : selectedVariant?.image_url
        ? [selectedVariant.image_url, ...baseImages.filter((u) => u !== selectedVariant.image_url)]
        : baseImages;

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant?.id]);

  const cartVariantId = hasVariants
    ? selectedVariant?.id ?? null
    : product.default_variant_id ?? selectedVariant?.id ?? null;

  return (
    <ShopFrontLayout>
      <div className="mx-auto max-w-7xl bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            {t("Home")}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-400 rtl:rotate-180" />

          {category ? (
            <>
              <Link
                href={`/category/${category.slug}`}
                className="text-gray-500 hover:text-gray-700"
              >
                {category.name}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-400 rtl:rotate-180" />
            </>
          ) : null}
          <span className="font-medium text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-md ring-1 ring-gray-200/80">
              {displayOnSale && (displayDiscount ?? 0) > 0 && (
                <span className="absolute start-3 top-3 z-10 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                  {t("SALE")} −{displayDiscount}%
                </span>
              )}
              <img
                src={images[selectedImage] || placeholder}
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl transition-shadow ${
                      selectedImage === i
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-white shadow-md"
                        : "ring-1 ring-gray-200 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-5 text-start sm:space-y-6">
            {/* Name + brand + stars */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl lg:text-4xl">{product.name}</h1>
              {product.brand ? (
                <p className="mt-1 text-sm text-gray-500">{product.brand}</p>
              ) : null}
              <div className="mt-2 flex items-center rtl:flex-row-reverse">
                <div className="flex items-center rtl:flex-row-reverse">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : i < product.rating
                          ? "text-yellow-400 fill-yellow-400 opacity-50"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="ms-2 text-sm text-gray-500 tabular-nums">
                  {product.rating}
                  {product.reviews_count > 0
                    ? ` (${product.reviews_count} ${t("reviews")})`
                    : null}
                </p>
              </div>
            </div>

            {/* Price row — on mobile: price left, add-to-cart button right */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3 rtl:flex-row-reverse">
                {/* Price */}
                <div className="min-w-0">
                  {displayOnSale &&
                    displayOriginal != null &&
                    displayOriginal > displayPrice && (
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-lg text-gray-400 line-through tabular-nums">
                          {formatPrice(displayOriginal)}
                        </span>
                        {displayDiscount != null && displayDiscount > 0 && (
                          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                            −{displayDiscount}%
                          </span>
                        )}
                      </div>
                    )}
                  <p className="text-3xl text-price tabular-nums sm:text-4xl">
                    {hasVariants && !selectedVariant
                      ? `${t("From")} ${formatPrice(product.price)}`
                      : formatPrice(displayPrice)}
                  </p>
                  {saleEndsLabel && (
                    <p className="mt-1 text-sm font-medium text-brand-dark">
                      {t("Sale ends in")} {saleEndsLabel}
                    </p>
                  )}
                </div>

                {/* Add-to-cart / stock badge — inline on mobile */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      displayInStock
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                        : "bg-red-50 text-red-800 ring-1 ring-red-200/80"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${displayInStock ? "bg-emerald-500" : "bg-red-500"}`} />
                    {displayInStock ? t("In Stock") : t("Out of Stock")}
                  </div>
                  {/* Compact add-to-cart visible only on mobile */}
                  <div className="sm:hidden">
                    <ProductBuyRow
                      layout="detail"
                      quantity={quantity}
                      disabled={!canAddToCart}
                      product={{
                        id: product.id,
                        name: product.name,
                        price: displayPrice,
                        image: selectedVariant?.image_url || product.image_url || product.image || "",
                        description: product.description || "",
                        category: product.category || "",
                        stock: displayStock,
                        in_stock: displayInStock,
                        variant_id: cartVariantId,
                        variant_label: selectedVariant?.option_label ?? null,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Variant selector */}
            {hasVariants && attributes.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
                {attributes.map((attr) => (
                  <div key={attr.id}>
                    <h3 className="text-sm font-semibold text-gray-900">{attr.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attr.values.map((val) => {
                        const selected = selectedOptions[attr.id] === val.id;
                        const available = isValueAvailable(attr.id, val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            disabled={!available}
                            onClick={() => selectOption(attr.id, val.id)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                              selected
                                ? "border-primary bg-primary text-white shadow-sm"
                                : available
                                  ? "border-gray-200 bg-white text-gray-800 hover:border-primary/50 hover:bg-brand-pink-soft/40"
                                  : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through",
                            )}
                          >
                            {val.hex_color ? (
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/10"
                                style={{ backgroundColor: val.hex_color }}
                              />
                            ) : null}
                            {val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!selectionComplete && (
                  <p className="text-xs text-gray-500">{t("Select options to continue")}</p>
                )}
              </div>
            )}

            {/* Quantity + full add-to-cart (desktop) + COD form (mobile) */}
            <div className="rounded-2xl border border-brand-border/90 bg-gradient-to-br from-brand-pink-soft/50 via-white to-white p-4 shadow-sm ring-1 ring-brand-pink-soft/50 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{t("Quantity")}</h3>
                  <div
                    className="mt-2 flex h-11 w-full max-w-[12rem] items-stretch overflow-hidden rounded-xl border border-primary/30 bg-white shadow-sm ring-1 ring-brand-pink-soft/60"
                    dir="ltr"
                  >
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex w-11 shrink-0 items-center justify-center text-lg font-semibold text-brand-dark/80 transition hover:bg-brand-pink-soft active:bg-brand-pink-soft/80 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={t("Decrease quantity")}
                    >
                      −
                    </button>
                    <span className="flex min-w-[3.25rem] flex-1 items-center justify-center border-x border-primary/25 bg-brand-pink-soft/40 text-lg font-bold tabular-nums text-brand-dark">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(Math.max(displayStock, 1), q + 1))}
                      disabled={!displayInStock || quantity >= displayStock}
                      className="flex w-11 shrink-0 items-center justify-center text-lg font-semibold text-brand-dark/80 transition hover:bg-brand-pink-soft active:bg-brand-pink-soft/80 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={t("Increase quantity")}
                    >
                      +
                    </button>
                  </div>
                  {displayInStock && selectionComplete ? (
                    <p className="mt-2 text-xs text-gray-500 tabular-nums">
                      {t("Stock")}: {displayStock} {t("units")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 border-t border-brand-border/80 pt-4 space-y-3">
                {/* Full add-to-cart — hidden on mobile (shown inline next to price) */}
                <div className="hidden sm:block">
                  <ProductBuyRow
                    layout="detail"
                    quantity={quantity}
                    disabled={!canAddToCart}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: displayPrice,
                      image: selectedVariant?.image_url || product.image_url || product.image || "",
                      description: product.description || "",
                      category: product.category || "",
                      stock: displayStock,
                      in_stock: displayInStock,
                      variant_id: cartVariantId,
                      variant_label: selectedVariant?.option_label ?? null,
                    }}
                  />
                </div>

                {/* Phone-only quick COD checkout */}
                {canAddToCart ? (
                  <div className="md:hidden pt-2">
                    <p className="mb-2 text-sm font-semibold text-zinc-800">
                      {t("checkout.quick_order")}
                    </p>
                    <CheckoutForm
                      compact
                      cartOverride={[
                        {
                          id: product.id,
                          variant_id: cartVariantId,
                          name: product.name,
                          variant_label: selectedVariant?.option_label ?? null,
                          price: displayPrice,
                          image: selectedVariant?.image_url || product.image_url || product.image || "",
                          quantity,
                          description: product.description || "",
                          category: product.category || "",
                        } satisfies CartItem,
                      ]}
                    />
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <FavoriteButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: displayPrice,
                      image: product.image_url || product.image || "",
                      description: product.description || "",
                      category: product.category || "",
                      slug: product.slug,
                    }}
                    variant="outline"
                    size="icon"
                    appearance="vibrant"
                    className="h-11 w-11 rounded-xl"
                  />
                  <button
                    type="button"
                    title={t("Share")}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      "bg-gradient-to-br from-brand-pink via-primary to-brand-pink",
                      "text-white shadow-sm transition hover:brightness-110",
                    )}
                    onClick={() => {
                      if (navigator.share) {
                        void navigator.share({ title: product.name, url: window.location.href });
                      } else {
                        void navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Description — below the form */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("Description")}</h3>
              {product.description ? (
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{product.description}</p>
              ) : (
                <p className="mt-3 text-sm text-gray-400">{t("No description available")}</p>
              )}
            </div>
          </div>
        </div>

        <section id="reviews" className="mt-14 scroll-mt-24 border-t border-gray-200 pt-10 text-start">
          <h2 className="text-2xl font-bold text-primary">{t("Customer reviews")}</h2>
          <p className="mt-1 text-sm text-gray-500 tabular-nums">
            {product.reviews_count > 0
              ? `${product.rating} · ${product.reviews_count}`
              : `${product.rating}`}{" "}
            {t("reviews")}
          </p>

          {flash?.review_submitted && (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {t("Thank you review")}
            </p>
          )}

          {userReview && (
            <p className="mt-4 rounded-lg border border-brand-pink-light bg-brand-pink-soft px-4 py-3 text-sm text-brand-text">
              {t("You reviewed this")}: {userReview.rating}/5
              {userReview.body ? ` — ${userReview.body}` : ""}
            </p>
          )}

          {canReview && auth?.user && (
            <form onSubmit={submitReview} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900">{t("Write a review")}</h3>
              <div>
                <Label className="text-gray-700">{t("Your rating")}</Label>
                <div className="mt-2 flex gap-1 rtl:flex-row-reverse">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setData("rating", n)}
                      className="rounded p-0.5 transition hover:opacity-90"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          n <= data.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {errors?.rating && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                )}
              </div>
              <div>
                <Label htmlFor="review-body" className="text-gray-700">
                  {t("Your review")}
                </Label>
                <Textarea
                  id="review-body"
                  value={data.body}
                  onChange={(e) => setData("body", e.target.value)}
                  rows={4}
                  className="mt-2 bg-white"
                  placeholder={t("Review placeholder")}
                />
              </div>
              <Button type="submit" disabled={processing} className="bg-primary hover:bg-brand-dark">
                {processing ? "…" : t("Submit review")}
              </Button>
            </form>
          )}

          {!canReview && !userReview && !auth?.user && (
            <p className="mt-4 text-sm text-gray-600">
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t("Sign in to review")}
              </Link>
            </p>
          )}

          <ul className="mt-8 space-y-6">
            {reviewsList.length === 0 ? (
              <li className="text-sm text-gray-500">{t("No reviews yet")}</li>
            ) : (
              reviewsList.map((r) => (
                <li key={r.id} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 rtl:flex-row-reverse">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={r.user.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {r.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 rtl:flex-row-reverse">
                      <span className="font-medium text-gray-900">{r.user.name}</span>
                      {r.created_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(r.created_at).toLocaleDateString(
                            locale === "ar" ? "ar" : locale === "en" ? "en" : "fr",
                            {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex rtl:flex-row-reverse">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${
                            n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    {r.body ? (
                      <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{r.body}</p>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {saleProducts.length > 0 ? (
          <div className="mt-16 border-t border-gray-100 pt-4">
            <ShopSales embedded products={saleProducts} />
          </div>
        ) : null}
      </div>
    </ShopFrontLayout>
  );
}
