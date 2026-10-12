"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/types/categories";
import { useI18n } from "@/lib/i18n";
import { categoryImageSrc } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function categoryImage(category: Category): string {
  return categoryImageSrc(category) || "/placeholder.jpg";
}

/**
 * Premium horizontal category carousel on the home page.
 * Not sticky — the header white category pills stay sticky instead.
 */
export default function ShopCategories({ categories = [] }: { categories?: Category[] }) {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";
  const page = usePage();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const activeSlug = useMemo(() => {
    const path = page.url.split("?")[0];
    const match = path.match(/\/category\/([^/]+)/);
    return match?.[1] ?? null;
  }, [page.url]);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    window.addEventListener("resize", updateScrollState);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories.length]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAutoScroll(!reduce && canScroll);
  }, [canScroll]);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    const speed = 28;
    const dir = isRtl ? -1 : 1;

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;

      if (!paused && el.scrollWidth > el.clientWidth + 4) {
        const max = el.scrollWidth - el.clientWidth;
        let next = el.scrollLeft + speed * dt * dir;
        if (dir > 0 && next >= max - 1) next = 0;
        if (dir < 0 && next <= 1) next = max;
        el.scrollLeft = next;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll, paused, isRtl, categories.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.min(280, el.clientWidth * 0.55) * dir * (isRtl ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!categories.length) {
    return null;
  }

  return (
    <section
      aria-label={t("Categories")}
      className={cn(
        "w-full border-b border-brand-border/70",
        "bg-white",
      )}
    >
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "hidden h-10 w-10 shrink-0 rounded-full border-brand-border bg-white shadow-card md:inline-flex",
              !canScroll && "invisible pointer-events-none",
            )}
            onClick={() => scrollByDir(-1)}
            aria-label={isRtl ? t("Next") : t("Previous")}
          >
            <ChevronLeft className={cn("h-5 w-5", isRtl && "rotate-180")} />
          </Button>

          <div className="min-w-0 flex-1">
            <div
              ref={scrollerRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              onTouchEnd={() => setPaused(false)}
              className={cn(
                "category-rail flex gap-3 overflow-x-auto py-3 sm:gap-4 sm:py-3.5 md:gap-5 md:py-4",
                "snap-x snap-mandatory scroll-smooth",
                "justify-start md:justify-center",
                isRtl && "flex-row-reverse",
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {categories.map((category, index) => {
                const active = activeSlug === category.slug;
                const href = `/category/${category.slug}`;
                const img = categoryImage(category);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index, 8) * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="snap-start shrink-0"
                  >
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex w-[4.75rem] flex-col items-center gap-2 outline-none",
                        "sm:w-[5.25rem] md:w-[5.75rem] lg:w-[6.25rem]",
                        "rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                      )}
                    >
                      <motion.div
                        whileHover={{ y: -2, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        animate={active ? { scale: 1.04 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                        className={cn(
                          "relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-50",
                          "shadow-card ring-1 ring-black/[0.04]",
                          "transition-[box-shadow,ring-color,ring-width] duration-300",
                          "group-hover:shadow-soft group-hover:ring-primary/25",
                          active && "shadow-soft ring-2 ring-primary",
                        )}
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.jpg";
                          }}
                        />
                        <div
                          className={cn(
                            "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.1] via-transparent to-white/10",
                            active && "from-primary/25",
                          )}
                          aria-hidden
                        />
                      </motion.div>

                      <span
                        className={cn(
                          "line-clamp-2 max-w-full text-center text-[11px] font-medium leading-tight tracking-tight sm:text-xs",
                          active ? "text-primary" : "text-brand-text group-hover:text-brand-dark",
                        )}
                      >
                        {category.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="snap-start shrink-0"
              >
                <Link
                  href="/categories"
                  className="group flex w-[4.75rem] flex-col items-center gap-2 sm:w-[5.25rem] md:w-[5.75rem] lg:w-[6.25rem]"
                  aria-label={t("View all categories")}
                >
                  <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-brand-pink-soft text-[11px] font-semibold tracking-wide text-brand-dark shadow-card ring-1 ring-black/[0.04] transition group-hover:bg-brand-pink-light/40 sm:text-xs">
                    {t("All")}
                  </div>
                  <span className="text-[11px] font-medium text-brand-muted sm:text-xs">{t("Browse")}</span>
                </Link>
              </motion.div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "hidden h-10 w-10 shrink-0 rounded-full border-brand-border bg-white shadow-card md:inline-flex",
              !canScroll && "invisible pointer-events-none",
            )}
            onClick={() => scrollByDir(1)}
            aria-label={isRtl ? t("Previous") : t("Next")}
          >
            <ChevronRight className={cn("h-5 w-5", isRtl && "rotate-180")} />
          </Button>
        </div>
      </div>

      <style>{`
        .category-rail {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .category-rail::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
