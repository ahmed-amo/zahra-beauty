import type { ReactNode } from "react";
import ShopFrontLayout from "@/layouts/shop-layout";
import ShopProducts from "@/components/Shop/ShopProducts";
import ShopDeliveryTrust from "@/components/Shop/ShopDeliveryTrust";
import { Link } from "@inertiajs/react";
import { useI18n } from "@/lib/i18n";
import type { Category } from "../types/categories";
import type { Product } from "../types/products";

export default function Home({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const { t } = useI18n();
  const links = (categories ?? []).slice(0, 6);

  return (
    <div className="bg-background pb-[env(safe-area-inset-bottom)] text-foreground">
      <section className="border-b border-brand-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-muted">
            {t("Luxury womenswear")}
          </p>
          <h1 className="mt-4 font-display text-5xl font-medium tracking-wide text-foreground sm:text-7xl">
            Zahra
          </h1>
          <p className="mt-4 text-sm tracking-[0.18em] text-foreground/80 uppercase">
            {t("New Collection · Dresses · Accessories")}
          </p>
          <div className="mt-10 h-px w-16 bg-[#C6A15B]" />
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C6A15B]">
            {t("The new collection")}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl text-foreground sm:text-5xl">
            {t("Elegance in every detail")}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted sm:text-base">
            {t("Discover timeless pieces made to stand out.")}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center justify-center bg-[#111111] px-10 py-3 text-xs font-semibold tracking-[0.22em] text-white uppercase hover:bg-black dark:bg-white dark:text-[#111111]"
          >
            {t("Shop now")}
          </Link>
        </div>
      </section>

      {links.length > 0 && (
        <nav className="border-b border-brand-border" aria-label={t("Categories")}>
          <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-[11px] font-semibold tracking-[0.18em] uppercase">
            {links.map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.slug}`} className="hover:text-[#C6A15B]">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <ShopProducts products={products} />
      <ShopDeliveryTrust />
    </div>
  );
}

Home.layout = (page: ReactNode) => <ShopFrontLayout>{page}</ShopFrontLayout>;
