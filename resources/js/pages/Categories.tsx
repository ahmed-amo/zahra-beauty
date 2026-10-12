"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import ShopFrontLayout from "@/layouts/shop-layout";
import { Category } from "@/types/categories";
import { Link } from "@inertiajs/react";
import { useI18n } from "@/lib/i18n";
import { categoryImageSrc } from "@/lib/mediaUrl";

interface Props {
  categories: Category[];
}

/** Sous-catégorie chips shown per card before collapsing into a "+N" link. */
const MAX_VISIBLE_CHILDREN = 5;

const imageFor = (category: Category) =>
  categoryImageSrc(category) || "/placeholder.jpg";

export default function Categories({ categories }: Props) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(true), []);

  return (
    <ShopFrontLayout>
      <div className="w-full bg-gray-50 px-4 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">
              {t("Here are our Categories")}
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              {t("Categories page subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => {
              const children = category.children ?? [];
              const visible = children.slice(0, MAX_VISIBLE_CHILDREN);
              const hiddenCount = children.length - visible.length;

              return (
                <div
                  key={category.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl"
                  style={{
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    opacity: isVisible ? 1 : 0,
                    transition: "all 0.7s ease",
                    transitionDelay: `${idx * 0.05}s`,
                  }}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className="relative block aspect-[16/10] overflow-hidden"
                  >
                    <img
                      src={imageFor(category)}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                      {category.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-white/80">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                    {children.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {visible.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/category/${child.slug}`}
                              className="inline-flex rounded-full bg-brand-pink-soft/70 px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-brand-pink-light/60"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                        {hiddenCount > 0 && (
                          <li>
                            <Link
                              href={`/category/${category.slug}`}
                              className="inline-flex rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                            >
                              {t("+:count more", { count: hiddenCount })}
                            </Link>
                          </li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-sm text-zinc-400">
                        {t("No sub-categories yet")}
                      </span>
                    )}

                    <Link
                      href={`/category/${category.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-brand-dark"
                    >
                      {t("Explore Category")}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ShopFrontLayout>
  );
}
