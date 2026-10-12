"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { categoryImageSrc } from "@/lib/mediaUrl";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SubnavCategory = {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
};

type Props = {
  items: SubnavCategory[];
  onNavigate?: () => void;
  className?: string;
  /** Pixels per second for the continuous marquee. */
  speed?: number;
};

/**
 * Horizontal subcategory cards with gentle auto-scroll.
 * Pauses on hover/focus; disabled when reduced-motion or too few items.
 */
export default function CategorySubnavMarquee({
  items,
  onNavigate,
  className,
  speed = 36,
}: Props) {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShouldMarquee(!reduce && items.length > 1);
  }, [items.length]);

  useEffect(() => {
    if (!shouldMarquee) return;

    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    const dir = isRtl ? -1 : 1;

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;

      if (!paused && el.scrollWidth > el.clientWidth + 4) {
        const max = el.scrollWidth - el.clientWidth;
        let next = el.scrollLeft + speed * dt * dir;
        if (dir > 0 && next >= max) next = 0;
        if (dir < 0 && next <= 0) next = max;
        el.scrollLeft = next;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldMarquee, paused, speed, isRtl, items.length]);

  if (items.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-brand-muted">{t("No sub-categories")}</p>
    );
  }

  const cards = shouldMarquee && items.length >= 3 ? [...items, ...items] : items;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={trackRef}
        className={cn(
          "category-subnav-marquee flex gap-3 overflow-x-auto pb-1",
          "scroll-smooth",
          isRtl && "flex-row-reverse",
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((child, index) => {
          const src = categoryImageSrc(child) || "/placeholder.jpg";
          return (
            <Link
              key={`${child.id}-${index}`}
              href={`/category/${child.slug}`}
              onClick={onNavigate}
              className={cn(
                "group flex w-[13.5rem] shrink-0 items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-2.5",
                "transition hover:border-primary/25 hover:bg-brand-pink-soft/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
              )}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.jpg";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-primary">
                  {child.name}
                </p>
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                  {t("Discover")}
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .category-subnav-marquee {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .category-subnav-marquee::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
