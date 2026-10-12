import { useState } from "react";
import { Link } from "@inertiajs/react";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cartContext";
import { useWishlist } from "@/contexts/wishlistContext";
import { useLandingI18n } from "@/landing/i18n";
import type { LandingCategory, LandingProduct } from "@/landing/mock";

export function ProductCard({
  product,
  withCart = true,
}: {
  product: LandingProduct;
  withCart?: boolean;
}) {
  const { t, formatPrice } = useLandingI18n();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const saved = isInWishlist(product.id);
  const [hover, setHover] = useState(false);
  const src = hover && product.hoverImage ? product.hoverImage : product.image;

  return (
    <article className="ld-card">
      <div
        className="ld-card-media"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Link href={`/product/${product.slug}`}>
          <img src={src} alt={product.name} width={600} height={800} loading="lazy" />
        </Link>
        <button
          type="button"
          className="ld-heart"
          aria-label={t("wish")}
          aria-pressed={saved}
          onClick={() =>
            toggleWishlist({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              description: product.description,
              category: product.category,
              slug: product.slug,
            })
          }
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        {withCart && (
          <button
            type="button"
            className="ld-add"
            aria-label={t("add")}
            onClick={() =>
              addToCart({
                id: product.id,
                variant_id: null,
                name: product.name,
                price: product.price,
                image: product.image,
                description: product.description,
                category: product.category,
              })
            }
          >
            <ShoppingBag size={15} />
          </button>
        )}
      </div>
      <h3>
        <Link href={`/product/${product.slug}`}>{product.name}</Link>
      </h3>
      <div className="ld-card-row">
        <span className="ld-price">{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}

const FILTERS: Array<LandingCategory | "All"> = ["All", "Women", "Men", "Accessories", "Footwear"];

export function ProductGrid({
  title,
  products,
  withFilters = false,
  withCart = true,
  viewAllHref = "/products",
}: {
  title: string;
  products: LandingProduct[];
  withFilters?: boolean;
  withCart?: boolean;
  viewAllHref?: string;
}) {
  const { t } = useLandingI18n();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const visible = filter === "All" ? products : products.filter((item) => item.category === filter);

  const label = (key: (typeof FILTERS)[number]) =>
    key === "All"
      ? t("filter.all")
      : key === "Women"
        ? t("cat.women")
        : key === "Men"
          ? t("cat.men")
          : key === "Accessories"
            ? t("cat.accessories")
            : t("cat.footwear");

  return (
    <section className="ld-section ld-band">
      <div className="ld-wrap">
        <div className="ld-head">
          <h2>{title}</h2>
          <div className="ld-head-side">
            {withFilters && (
              <div className="ld-tabs" role="tablist">
                {FILTERS.map((key) => (
                  <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                    {label(key)}
                  </button>
                ))}
              </div>
            )}
            <Link href={viewAllHref} className={withFilters ? "ld-text-link ld-view-mobile" : "ld-text-link"}>
              {t("viewAll")} →
            </Link>
          </div>
        </div>
        <div className="ld-grid">
          {visible.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} withCart={withCart} />
          ))}
        </div>
      </div>
    </section>
  );
}
