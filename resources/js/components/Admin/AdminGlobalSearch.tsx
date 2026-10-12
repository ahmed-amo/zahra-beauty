"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Loader2, Package, Search, ShoppingCart, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { formatDA } from "@/lib/currency";
import { cn } from "@/lib/utils";

type ProductHit = {
  id: number;
  name: string;
  category: string | null;
  image_url: string | null;
  href: string;
};

type OrderHit = {
  id: number;
  order_number: string;
  customer_name: string | null;
  total: number;
  status: string;
  href: string;
};

type CustomerHit = {
  id: number;
  name: string;
  email: string;
  href: string;
};

type SearchPayload = {
  products: ProductHit[];
  orders: OrderHit[];
  customers: CustomerHit[];
};

const empty: SearchPayload = { products: [], orders: [], customers: [] };

export default function AdminGlobalSearch({
  isRtl = false,
}: {
  isRtl?: boolean;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchPayload>(empty);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total =
    results.products.length + results.orders.length + results.customers.length;

  const runSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setResults(empty);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(
        `/admin/search?q=${encodeURIComponent(q.trim())}`,
        {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as SearchPayload;
      setResults({
        products: data.products ?? [],
        orders: data.orders ?? [],
        customers: data.customers ?? [],
      });
      setOpen(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setResults(empty);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.visit(href);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400",
          isRtl ? "right-3" : "left-3",
        )}
      />
      <Input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") {
            e.preventDefault();
            const first =
              results.products[0]?.href ||
              results.orders[0]?.href ||
              results.customers[0]?.href;
            if (first) go(first);
          }
        }}
        placeholder={t("Search products, orders, customers...")}
        className={cn(
          "bg-white/50 dark:bg-zinc-900/70 dark:text-zinc-100 backdrop-blur border-gray-200/50 dark:border-zinc-700/50 focus:border-primary focus:ring-primary",
          isRtl ? "pr-10 pl-9 text-right" : "pl-10 pr-9",
        )}
        autoComplete="off"
      />
      {query.length > 0 && (
        <button
          type="button"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800",
            isRtl ? "left-2" : "right-2",
          )}
          aria-label={t("Clear search")}
          onClick={() => {
            setQuery("");
            setResults(empty);
            setOpen(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute start-0 end-0 top-full z-[80] mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("Search loading")}
            </div>
          )}

          {!loading && total === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              {t("Search no suggestions")}
            </p>
          )}

          {!loading && results.products.length > 0 && (
            <Section title={t("Products")} icon={Package}>
              {results.products.map((p) => (
                <button
                  key={`p-${p.id}`}
                  type="button"
                  onClick={() => go(p.href)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-brand-pink-soft/60 dark:hover:bg-zinc-800"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="m-2 h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {p.category || t("Product")}
                    </p>
                  </div>
                </button>
              ))}
            </Section>
          )}

          {!loading && results.orders.length > 0 && (
            <Section title={t("Orders")} icon={ShoppingCart}>
              {results.orders.map((o) => (
                <button
                  key={`o-${o.id}`}
                  type="button"
                  onClick={() => go(o.href)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-brand-pink-soft/60 dark:hover:bg-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {o.order_number || `#${o.id}`}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {o.customer_name || "—"} · {o.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {formatDA(o.total, locale)}
                  </span>
                </button>
              ))}
            </Section>
          )}

          {!loading && results.customers.length > 0 && (
            <Section title={t("Customers")} icon={Users}>
              {results.customers.map((c) => (
                <Link
                  key={`c-${c.id}`}
                  href={c.href}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-brand-pink-soft/60 dark:hover:bg-zinc-800"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-zinc-500">{c.email}</p>
                  </div>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Package;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      {children}
    </div>
  );
}
