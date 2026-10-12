import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

export type ShopBrand = {
  id: number;
  name: string;
  slug: string;
  url: string | null;
  image_url: string | null;
  logo_url: string | null;
};

function BrandCard({ brand }: { brand: ShopBrand }) {
  const imageSrc = mediaUrl(brand.image_url, null);
  const logoSrc = mediaUrl(brand.logo_url, null);
  const inner = (
    <div className="group relative aspect-[3/4] w-[9.5rem] shrink-0 overflow-hidden rounded-2xl bg-zinc-200 shadow-sm sm:w-[11rem] md:w-[12.5rem]">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-pink-soft to-zinc-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 p-3">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={brand.name}
            className="h-8 max-w-[80%] object-contain brightness-0 invert drop-shadow sm:h-9"
            draggable={false}
          />
        ) : (
          <span className="text-center text-sm font-bold tracking-tight text-white drop-shadow">
            {brand.name}
          </span>
        )}
      </div>
    </div>
  );

  if (brand.url) {
    const external = /^https?:\/\//i.test(brand.url);
    if (external) {
      return (
        <a
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          title={brand.name}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={brand.url} className="block" title={brand.name}>
        {inner}
      </Link>
    );
  }

  return <div title={brand.name}>{inner}</div>;
}

/**
 * Endless brand marquee: one filled sequence duplicated twice; CSS moves
 * exactly -50% so the second copy replaces the first with no empty gap.
 */
export default function ShopBrands({ brands }: { brands: ShopBrand[] }) {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** How many times to repeat `brands` inside ONE sequence so it fills the screen. */
  const [repeat, setRepeat] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (brands.length === 0) return;

    const measure = () => {
      const view = viewportRef.current;
      const seq = measureRef.current;
      if (!view || !seq) return;
      const seqWidth = seq.scrollWidth;
      const viewWidth = view.clientWidth;
      if (seqWidth <= 0) return;
      // One sequence must be at least as wide as the viewport (slightly more).
      setRepeat(Math.max(1, Math.ceil((viewWidth * 1.15) / seqWidth)));
    };

    // First paint uses repeat=1 to measure a single brands row.
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [brands]);

  const sequence = useMemo(() => {
    const rows: ShopBrand[] = [];
    for (let i = 0; i < repeat; i++) {
      rows.push(...brands);
    }
    return rows;
  }, [brands, repeat]);

  const shouldMarquee = !reduceMotion && brands.length > 0;
  const durationSec = Math.max(20, sequence.length * 3.2);

  if (!brands.length) {
    return null;
  }

  return (
    <section
      className="border-b border-brand-border/70 bg-white py-6 md:py-8"
      aria-label={t("Top brands")}
    >
      <div className="mx-auto flex max-w-[1920px] items-end justify-center gap-4 px-3 sm:px-5 md:px-8">
        <h2 className="text-center text-lg font-bold tracking-tight text-zinc-900 sm:text-xl md:text-2xl">
          {t("Top brands")}
        </h2>
      </div>

      <div
        ref={viewportRef}
        className="relative mt-4 overflow-hidden sm:mt-5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-14" />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-14" />

        {/* Hidden single-row measure (one set of brands) */}
        <div
          ref={measureRef}
          className="pointer-events-none absolute -z-10 flex gap-3 opacity-0 sm:gap-4"
          aria-hidden
        >
          {brands.map((brand) => (
            <div key={`m-${brand.id}`} className="w-[9.5rem] shrink-0 sm:w-[11rem] md:w-[12.5rem]" />
          ))}
        </div>

        {shouldMarquee ? (
          <div
            className={cn(
              "flex w-max py-1",
              isRtl ? "animate-brand-marquee-rtl" : "animate-brand-marquee",
              paused && "[animation-play-state:paused]",
            )}
            style={{ animationDuration: `${durationSec}s` }}
          >
            {/* Identical halves (content + trailing gap) so translateX(-50%) is seamless */}
            <div className="flex shrink-0 gap-3 pe-3 sm:gap-4 sm:pe-4">
              {sequence.map((brand, i) => (
                <BrandCard key={`a-${brand.id}-${i}`} brand={brand} />
              ))}
            </div>
            <div className="flex shrink-0 gap-3 pe-3 sm:gap-4 sm:pe-4" aria-hidden>
              {sequence.map((brand, i) => (
                <BrandCard key={`b-${brand.id}-${i}`} brand={brand} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 px-3 py-1 sm:gap-4 sm:px-5">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
