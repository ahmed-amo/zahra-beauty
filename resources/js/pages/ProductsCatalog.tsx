"use client"

import { FormEvent, useEffect, useState } from "react"
import { ChevronRight, Search, Star, Package } from "lucide-react"
import ShopFrontLayout from "@/layouts/shop-layout"
import { Link, router, usePage } from "@inertiajs/react"
import { Product } from "@/types/products"
import { Category } from "@/types/categories"
import ProductBuyRow from "@/components/ProductBuyRow"
import FavoriteButton from "@/components/FavoriteButton"
import { useI18n, localizePaginationLabelHtml } from "@/lib/i18n"
import { categoryImageSrc } from "@/lib/mediaUrl"

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedProducts {
  data: Product[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  links?: PaginationLink[]
}

interface PageProps {
  categories: Category[]
  selectedCategory?: Category | null
  filters: { q: string; category: string }
  products: PaginatedProducts | null
  [key: string]: unknown
}

const CATEGORY_GRADIENTS = [
  "from-primary/90 to-brand-pink",
  "from-emerald-500/90 to-teal-600",
  "from-amber-500/90 to-orange-600",
  "from-violet-500/90 to-indigo-600",
  "from-rose-500/90 to-pink-600",
  "from-sky-500/90 to-blue-600",
]

function getProductImage(product: Product) {
  if (product.image_url) return product.image_url
  if (product.image) {
    if (product.image.startsWith("http")) return product.image
    if (product.image.startsWith("catpics/") || product.image.startsWith("producss/")) {
      return `/${product.image}`
    }
    return `/storage/${product.image}`
  }
  return "/placeholder.jpg"
}

export default function ProductsCatalog() {
  const { categories, selectedCategory, filters, products } = usePage<PageProps>().props
  const { t, locale, formatPrice } = useI18n()
  const [query, setQuery] = useState(filters.q ?? "")

  useEffect(() => {
    setQuery(filters.q ?? "")
  }, [filters.q])

  const showProducts = Boolean(selectedCategory || filters.q)
  const activeCategorySlug = selectedCategory?.slug ?? filters.category ?? ""

  const visitCatalog = (params: { category?: string; q?: string; page?: number }) => {
    router.get(
      "/products",
      {
        category: params.category || undefined,
        q: params.q?.trim() || undefined,
        page: params.page && params.page > 1 ? params.page : undefined,
      },
      { preserveState: true, preserveScroll: false, replace: false },
    )
  }

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    visitCatalog({ category: activeCategorySlug, q: query })
  }

  return (
    <ShopFrontLayout>
      <div className="mx-auto max-w-7xl bg-white px-4 py-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            {t("Home")}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />
          <span className="font-medium text-gray-900">{t("All products")}</span>
          {selectedCategory ? (
            <>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />
              <span className="font-medium text-primary">{selectedCategory.name}</span>
            </>
          ) : null}
        </nav>

        <div className="mb-8 text-start">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCategory ? selectedCategory.name : t("All products")}
          </h1>
          <p className="mt-2 text-gray-600">
            {showProducts && products
              ? t("Showing products count")
                  .replace("{shown}", String(products.data.length))
                  .replace("{total}", String(products.total))
              : t("catalog.pick_category")}
          </p>

          <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center rtl:sm:flex-row-reverse">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search products...")}
                className="w-full rounded-xl border border-gray-200 py-3 ps-11 pe-4 text-start text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                name="q"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
            >
              {t("Search")}
            </button>
          </form>
        </div>

        {/* Category tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => visitCatalog({ q: filters.q })}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !activeCategorySlug
                ? "bg-primary text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("catalog.all_categories")}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => visitCatalog({ category: category.slug, q: filters.q })}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategorySlug === category.slug
                  ? "bg-primary text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.name}
              {category.products_count != null ? (
                <span className="ms-1.5 opacity-80">({category.products_count})</span>
              ) : null}
            </button>
          ))}
        </div>

        {!showProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {categories.map((category, index) => {
              const image = categoryImageSrc(category)
              const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length]

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => visitCatalog({ category: category.slug })}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
                    {image ? (
                      <img
                        src={image}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                        <Package className="h-14 w-14 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                      <h2 className="text-base font-bold text-white sm:text-2xl">{category.name}</h2>
                      {category.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-white/85">{category.description}</p>
                      ) : null}
                      {category.products_count != null ? (
                        <p className="mt-2 text-sm font-medium text-white/90">
                          {t("catalog.products_count", { count: category.products_count })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : products && products.data.length > 0 ? (
          <>
            {!selectedCategory && filters.q ? (
              <p className="mb-4 text-sm text-gray-600">
                {t("for query")} &ldquo;{filters.q}&rdquo;
              </p>
            ) : null}

            {selectedCategory ? (
              <button
                type="button"
                onClick={() => visitCatalog({ q: filters.q })}
                className="mb-6 text-sm font-semibold text-primary hover:text-brand-dark"
              >
                ← {t("catalog.back_categories")}
              </button>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <article key={product.id} className="group relative flex flex-col">
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="media-frame relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f4f1ea]">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-contain p-1.5 transition duration-300 sm:p-2"
                        loading="lazy"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.jpg"
                        }}
                      />
                      {!product.in_stock ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-sm font-medium text-white">{t("Out of Stock")}</span>
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  <div className="absolute end-2 top-2 z-10">
                    <FavoriteButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: getProductImage(product),
                        description: product.description || "",
                        category: product.category || "",
                        slug: product.slug,
                      }}
                      variant="icon"
                      className="rounded-full bg-white/90 shadow-sm hover:bg-white"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 text-start">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 group-hover:text-primary">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 rtl:flex-row-reverse">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(product.rating ?? 5)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      {product.reviews_count ? (
                        <span className="text-xs text-gray-500">({product.reviews_count})</span>
                      ) : null}
                    </div>
                    <p className="text-lg font-bold tabular-nums text-gray-900">{formatPrice(product.price)}</p>
                    <ProductBuyRow
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: getProductImage(product),
                        description: product.description || "",
                        category: product.category || "",
                        in_stock: product.in_stock,
                      }}
                      disabled={!product.in_stock}
                    />
                  </div>
                </article>
              ))}
            </div>

            {products.last_page > 1 && products.links ? (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
                {products.links.map((link, i) =>
                  link.url ? (
                    <Link
                      key={i}
                      href={link.url}
                      preserveScroll
                      className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium ${
                        link.active
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      dangerouslySetInnerHTML={{ __html: localizePaginationLabelHtml(link.label, locale) }}
                    />
                  ) : (
                    <span
                      key={i}
                      className="min-w-[2.5rem] px-3 py-2 text-sm text-gray-400"
                      dangerouslySetInnerHTML={{ __html: localizePaginationLabelHtml(link.label, locale) }}
                    />
                  ),
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-500">{t("No products found matching filters")}</p>
            <button
              type="button"
              onClick={() => visitCatalog({})}
              className="mt-4 font-medium text-primary hover:text-brand-dark"
            >
              {t("catalog.back_categories")}
            </button>
          </div>
        )}
      </div>
    </ShopFrontLayout>
  )
}
