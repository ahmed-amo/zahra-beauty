import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, Facebook, Instagram, Mail, ShieldCheck, Truck, RotateCcw, BadgeCheck, Youtube } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { LANDING_BRAND, landingConfig } from "@/landing/landing.config";
import { IMAGES, getLandingProducts, type LandingProduct } from "@/landing/mock";
import { useLandingI18n } from "@/landing/i18n";
import { ProductCard, ProductGrid } from "@/landing/LandingCards";
import LandingHeader from "@/landing/LandingHeader";
import type { Product } from "@/types/products";

const HERO = [IMAGES.hero1, IMAGES.hero2, IMAGES.hero3];

function on(flag: boolean) {
  return flag;
}

export default function LandingPage({ products }: { products: Product[] }) {
  const { t } = useLandingI18n();
  const theme = landingConfig.theme;
  const catalog = getLandingProducts(products);
  const featured = catalog.slice(0, 8);
  const best = [...catalog].reverse().slice(0, 4);
  const sections = landingConfig.sections;

  return (
    <>
      <LandingHeader />
      <main>
        {on(sections.hero) && (theme === "b" ? <HeroB /> : <HeroA />)}
        {on(sections.categories) && (theme === "b" ? <Circles /> : <CategoriesA />)}
        {on(sections.featured) &&
          (theme === "b" ? (
            <Arrivals products={featured.slice(0, 4)} />
          ) : (
            <ProductGrid title={t("featured")} products={featured} withFilters />
          ))}
        {theme === "b" ? <Banners /> : on(sections.promo) && <PromoA />}
        {theme === "a" && on(sections.bestsellers) && (
          <Best products={best} />
        )}
        {theme === "a" && on(sections.summerSale) && <SaleA />}
        {(theme === "b" || sections.testimonials) && <Quotes />}
        {(theme === "b" || sections.instagram) && <InstagramStrip />}
        {on(sections.newsletter) && <Newsletter theme={theme} />}
      </main>
      <SiteFooter />
    </>
  );
}

function HeroA() {
  const { t } = useLandingI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [index, setIndex] = useState(0);

  const go = (next: number) => {
    const el = scroller.current;
    if (!el) return;
    const i = (next + HERO.length) % HERO.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setIndex(i);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      setIndex((current) => {
        const next = (current + 1) % HERO.length;
        const el = scroller.current;
        if (el) {
          el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        }
        return next;
      });
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className="ld-hero"
      aria-roledescription="carousel"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div
        className="ld-hero-track"
        dir="ltr"
        ref={scroller}
        onScroll={(event) => {
          const el = event.currentTarget;
          const i = Math.round(Math.abs(el.scrollLeft) / Math.max(el.clientWidth, 1));
          if (i !== index) setIndex(i);
        }}
      >
        {HERO.map((src, i) => (
          <article className="ld-slide" key={src} aria-hidden={i !== index}>
            <img src={src} alt={i === 0 ? t("hero.mobileTitle") : ""} width={1600} height={1000} fetchPriority={i === 0 ? "high" : "low"} />
            <div className="ld-slide-scrim" />
            <div className="ld-slide-copy">
              <p className="ld-kicker ld-only-desktop">{t("hero.label")}</p>
              <h1 className="ld-only-desktop">
                {t("hero.line1")}
                <span>{t("hero.line2")}</span>
              </h1>
              <p className="ld-only-desktop">{t("hero.sub")}</p>
              <h1 className="ld-only-mobile">{t("hero.mobileTitle")}</h1>
              <p className="ld-only-mobile">{t("hero.mobileSub")}</p>
              <Link href="/products" className="ld-btn" style={{ marginTop: 18 }}>
                {t("hero.cta")} →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <button type="button" className="ld-arrow prev" aria-label={t("hero.prev")} onClick={() => go(index - 1)}>
        <ChevronLeft />
      </button>
      <button type="button" className="ld-arrow next" aria-label={t("hero.next")} onClick={() => go(index + 1)}>
        <ChevronRight />
      </button>
      <div className="ld-dots" role="tablist" aria-label={t("hero.dots")}>
        {HERO.map((src, i) => (
          <button key={src} type="button" aria-label={`${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}

function CategoriesA() {
  const { t } = useLandingI18n();
  const tiles = [
    [IMAGES.women, t("cat.women"), "/category/robes"],
    [IMAGES.men, t("cat.men"), "/products"],
    [IMAGES.accessories, t("cat.accessories"), "/category/accessoires"],
    [IMAGES.footwear, t("cat.footwear"), "/category/accessoires"],
  ] as const;

  return (
    <>
      <section className="ld-section ld-cats-desktop">
        <div className="ld-wrap ld-cat-grid">
          {tiles.map(([src, label, href]) => (
            <Link key={label} href={href} className="ld-cat">
              <img src={src} alt={label} width={640} height={800} loading="lazy" />
              <div className="ld-cap">
                <strong>{label}</strong>
                <span>{t("cat.collection")} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="ld-mobile-cats" aria-label={t("cat.shopBy")}>
        <h2>{t("cat.shopBy")}</h2>
        <div className="ld-circles">
          {tiles.map(([src, label, href]) => (
            <Link key={label} href={href} className="ld-circle">
              <i><img src={src} alt="" width={168} height={168} loading="lazy" /></i>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function PromoA() {
  const { t } = useLandingI18n();
  const items = [
    [BadgeCheck, "trust.quality.t", "trust.quality.d"],
    [Truck, "trust.ship.t", "trust.ship.d"],
    [RotateCcw, "trust.returns.t", "trust.returns.d"],
    [ShieldCheck, "trust.secure.t", "trust.secure.d"],
  ] as const;

  return (
    <section className="ld-section">
      <div className="ld-wrap">
        <div className="ld-promo">
          <div>
            <h2>{t("promo.title")}</h2>
            <p>{t("promo.sub")}</p>
            <Link href="/products" className="ld-btn" style={{ marginTop: 16 }}>
              {t("promo.cta")} →
            </Link>
          </div>
          <div className="ld-promo-photo">
            <img src={IMAGES.coat} alt={t("promo.title")} width={800} height={1000} loading="lazy" />
          </div>
          <ul className="ld-trust">
            {items.map(([Icon, title, body]) => (
              <li key={title}>
                <Icon size={18} aria-hidden />
                <strong>{t(title)}</strong>
                <p>{t(body)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Best({ products }: { products: LandingProduct[] }) {
  const { t } = useLandingI18n();
  return <ProductGrid title={t("bestsellers")} products={products} />;
}

function SaleA() {
  const { t } = useLandingI18n();
  return (
    <section className="ld-section">
      <div className="ld-wrap">
        <div className="ld-sale">
          <div className="ld-sale-copy">
            <h2>{t("sale.title")}</h2>
            <h3>
              {t("sale.lead")} <span>{t("sale.percent")}</span> {t("sale.tail")}
            </h3>
            <p>{t("sale.sub")}</p>
            <Link href="/products" className="ld-btn" style={{ marginTop: 16 }}>
              {t("sale.cta")} →
            </Link>
          </div>
          <div className="ld-sale-photo">
            <img src={IMAGES.hero1} alt={t("sale.title")} width={900} height={1100} loading="lazy" />
            <div className="ld-badge">{t("sale.badge")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroB() {
  const { t } = useLandingI18n();
  return (
    <section className="ld-hero-b">
      <div className="ld-hero-b-copy">
        <h1>{t("heroB.title")}</h1>
        <p>{t("heroB.sub")}</p>
        <div className="ld-actions">
          <Link href="/products" className="ld-btn">{t("heroB.cta")}</Link>
          <Link href="/categories" className="ld-text-link">{t("heroB.explore")} →</Link>
        </div>
      </div>
      <div className="ld-hero-b-photo">
        <img src={IMAGES.dress} alt={t("heroB.title")} width={1200} height={1500} />
      </div>
    </section>
  );
}

function Circles() {
  const { t } = useLandingI18n();
  const items = [
    [IMAGES.dress, t("cat.dresses"), "/category/robes"],
    [IMAGES.hijab, t("cat.tops"), "/products"],
    [IMAGES.hero3, t("cat.bottoms"), "/products"],
    [IMAGES.handbag, t("cat.bags"), "/category/accessoires"],
    [IMAGES.hijabBlack, t("cat.accessories"), "/category/accessoires"],
    [IMAGES.coat, t("cat.blazers"), "/category/manteaux"],
    [IMAGES.sneakers, t("cat.shoes"), "/category/accessoires"],
  ] as const;
  return (
    <section className="ld-section">
      <div className="ld-circles" style={{ justifyContent: "center" }}>
        {items.map(([src, label, href]) => (
          <Link key={label} href={href} className="ld-circle">
            <i><img src={src} alt="" width={168} height={168} loading="lazy" /></i>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Arrivals({ products }: { products: LandingProduct[] }) {
  const { t } = useLandingI18n();
  return (
    <section className="ld-section">
      <div className="ld-wrap ld-split">
        <div>
          <h2 className="ld-serif" style={{ fontSize: 48, margin: 0 }}>{t("arrivals")}</h2>
          <p style={{ color: "var(--ld-muted)" }}>{t("arrivals.sub")}</p>
          <Link href="/products" className="ld-btn">{t("arrivals.cta")}</Link>
        </div>
        <div className="ld-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} withCart={false} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Banners() {
  const { t } = useLandingI18n();
  return (
    <section className="ld-section">
      <div className="ld-wrap ld-banners">
        <article className="ld-banner brown">
          <div>
            <h3>{t("summer.kicker")}</h3>
            <p>{t("summer.sub")}</p>
            <strong>{t("summer.off")}</strong>
            <Link href="/products" className="ld-text-link" style={{ marginTop: 12 }}>{t("summer.cta")} →</Link>
          </div>
          <img src={IMAGES.hero1} alt={t("summer.kicker")} width={640} height={800} loading="lazy" />
        </article>
        <article className="ld-banner taupe">
          <div>
            <h3>{t("edit.kicker")}</h3>
            <p>{t("edit.sub")}</p>
            <Link href="/category/accessoires" className="ld-text-link" style={{ marginTop: 12 }}>{t("edit.cta")} →</Link>
          </div>
          <img src={IMAGES.bagEdit} alt={t("edit.kicker")} width={640} height={800} loading="lazy" />
        </article>
      </div>
    </section>
  );
}

function Quotes() {
  const { t } = useLandingI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const items = [
    ["quote.1", "quote.1n"],
    ["quote.2", "quote.2n"],
    ["quote.3", "quote.3n"],
  ] as const;
  const scroll = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <section className="ld-section">
      <div className="ld-wrap">
        <div className="ld-head">
          <h2>{t("quotes")}</h2>
          <div className="ld-quote-nav">
            <button type="button" className="ld-icon" aria-label={t("hero.prev")} onClick={() => scroll(-1)}>
              <ChevronLeft />
            </button>
            <button type="button" className="ld-icon" aria-label={t("hero.next")} onClick={() => scroll(1)}>
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="ld-quotes" ref={scroller}>
          {items.map(([quote, name]) => (
            <blockquote className="ld-quote" key={quote}>
              <p className="ld-stars" aria-label="5">★★★★★</p>
              <p>{t(quote)}</p>
              <footer>— {t(name)}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramStrip() {
  const { t } = useLandingI18n();
  const shots = [IMAGES.hero1, IMAGES.hero2, IMAGES.dress, IMAGES.handbag, IMAGES.sneakers, IMAGES.hijab, IMAGES.coat];
  return (
    <section>
      <h2 className="ld-serif" style={{ textAlign: "center" }}>{t("ig")}</h2>
      <div className="ld-ig">
        {shots.map((src) => (
          <a key={src} href="https://instagram.com" aria-label={t("ig")}>
            <img src={src} alt="" width={320} height={320} loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ theme }: { theme: "a" | "b" }) {
  const { t } = useLandingI18n();
  const [email, setEmail] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setEmail("");
  };
  return (
    <section className={theme === "b" ? "ld-news-b" : "ld-section"}>
      <div className="ld-wrap ld-news">
        {theme === "b" && <Mail aria-hidden />}
        <div>
          <h2>{theme === "b" ? `${t("news.join")} ${LANDING_BRAND}` : t("news.title")}</h2>
          <p>{theme === "b" ? t("news.b") : t("news.sub")}</p>
        </div>
        <form className="ld-news-form" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("news.placeholder")}
            aria-label={t("news.placeholder")}
          />
          <button className="ld-btn" type="submit">{t("news.cta")}</button>
        </form>
        {theme === "a" && (
          <div>
            <p className="ld-kicker">{t("news.follow")}</p>
            <Social />
          </div>
        )}
      </div>
    </section>
  );
}

function Social() {
  const items = [
    { label: "Instagram", node: <Instagram size={16} /> },
    { label: "Facebook", node: <Facebook size={16} /> },
    { label: "Pinterest", node: <PinterestIcon /> },
    { label: "YouTube", node: <Youtube size={16} /> },
    { label: "TikTok", node: <TikTokIcon /> },
  ];
  return (
    <div className="ld-social">
      {items.map((item) => (
        <a key={item.label} href="https://instagram.com" aria-label={item.label}>
          {item.node}
        </a>
      ))}
    </div>
  );
}

function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M11 17c.4-1.6.8-3.1.9-4.6.1-.2.1-.5 0-.7-.3-.8-.4-1.6.2-2.2.7-.7 1.8-.4 2 .5.3 1.1-.2 2.3-.8 3.1-.3.4-.3.6-.1.9.4.6 1.2.8 1.9.6 1.5-.4 2.5-1.8 2.5-3.4 0-2.4-2-4.4-5.1-4.4-3.2 0-5.2 2.2-5.2 4.6 0 1.1.4 2.1 1.3 2.5.2.1.3 0 .3-.2l.2-.7c0-.2 0-.3-.1-.4-.3-.4-.5-.9-.5-1.5 0-1.9 1.5-3.7 4-3.7 2.2 0 3.7 1.4 3.7 3.4 0 2.3-1.1 3.9-2.7 3.9-.9 0-1.5-.7-1.3-1.6.2-.9.7-1.9.7-2.5 0-.6-.3-1.1-.9-1.1-.7 0-1.3.8-1.3 1.8 0 .6.2 1.1.2 1.1l-.9 3.8" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.5 3c.4 2.4 1.8 4.1 4.2 4.4v2.4c-1.4 0-2.7-.4-4.2-1.3v6.7c0 3.4-2.6 5.8-5.8 5.8S3 18.6 3 15.2c0-3.3 2.5-5.7 5.7-5.8v2.6c-1.6.1-2.8 1.3-2.8 3.1 0 1.8 1.3 3.1 3 3.1s2.9-1.4 2.9-3.2V3h2.7z" />
    </svg>
  );
}

function SiteFooter() {
  const { t } = useLandingI18n();
  const year = new Date().getFullYear();
  const columns = [
    [t("footer.shop"), [[t("cat.women"), "/category/robes"], [t("cat.men"), "/products"], [t("cat.accessories"), "/category/accessoires"], [t("cat.footwear"), "/category/accessoires"]]],
    [t("footer.support"), [[t("footer.help"), "/products"], [t("footer.track"), "/login"], [t("footer.returns"), "/products"], [t("footer.size"), "/products"]]],
    [t("footer.company"), [[t("footer.aboutUs"), "/products"], [t("footer.story"), "/products"], [t("footer.careers"), "/products"], [t("footer.contact"), "/products"]]],
  ] as const;

  return (
    <footer className="ld-footer">
      <div className="ld-wrap">
        <div className="ld-footer-grid">
          <div>
            <Link href="/" className="ld-logo" style={{ margin: 0 }} aria-label={LANDING_BRAND}>
              <BrandLogo tone={landingConfig.theme === "b" ? "on-light" : "on-dark"} className="ld-logo-img" />
            </Link>
            <p>{t("footer.tagline")}</p>
            <Social />
          </div>
          {columns.map(([title, links]) => (
            <div key={title}>
              <strong>{title}</strong>
              {links.map(([label, href]) => (
                <Link key={label} href={href}>{label}</Link>
              ))}
            </div>
          ))}
          <div>
            <strong>{t("footer.accept")}</strong>
            <div className="ld-pay">
              <span>{t("pay.visa")}</span>
              <span>{t("pay.mc")}</span>
              <span>{t("pay.pp")}</span>
              <span>{t("pay.apple")}</span>
              <span>{t("pay.gpay")}</span>
            </div>
          </div>
        </div>
        <div className="ld-bottom">
          <span>© {year} {LANDING_BRAND}. {t("footer.rights")}</span>
          <span>
            <Link href="/products">{t("footer.privacy")}</Link>
            {" · "}
            <Link href="/products">{t("footer.terms")}</Link>
            {" · "}
            <Link href="/categories">{t("footer.sitemap")}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
