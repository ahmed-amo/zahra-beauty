"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, Package, Tag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { router } from "@inertiajs/react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface Suggestion {
  id: number;
  name: string;
  slug: string;
  type: "product" | "category";
  price?: number;
  image_url?: string | null;
}

const RECENT_KEY = "zahra-recent-searches";
const RECENT_MAX = 6;
const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readRecent(): string[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string): void {
  const t = q.trim();
  if (t.length < 2) return;
  try {
    const prev = readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
    prev.unshift(t);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(prev.slice(0, RECENT_MAX)));
  } catch {
    /* ignore */
  }
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-brand-pink-soft px-0.5 font-semibold text-brand-dark">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SearchAutocomplete({
  mobile = false,
  className = "",
}: {
  mobile?: boolean;
  className?: string;
}) {
  const { t, formatPrice } = useI18n();
  const listId = useId();
  const statusId = `${listId}-status`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqSeq = useRef(0);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setShowRecent(false);
    setHighlighted(-1);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closePanel]);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < MIN_CHARS) {
        setSuggestions([]);
        setLoading(false);
        setIsOpen(false);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const seq = ++reqSeq.current;

      setLoading(true);
      try {
        const url = `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          signal: ac.signal,
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { categories?: Suggestion[]; products?: Suggestion[] };
        if (seq !== reqSeq.current || ac.signal.aborted) return;

        const all: Suggestion[] = [...(data.categories ?? []), ...(data.products ?? [])];
        setSuggestions(all);
        setIsOpen(true);
        setHighlighted(-1);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSuggestions([]);
        setIsOpen(true);
      } finally {
        if (seq === reqSeq.current && !ac.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query;

    if (!q.trim() || q.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      if (!showRecent) setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    setShowRecent(false);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(q);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions, showRecent]);

  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const el = optionRefs.current[highlighted];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlighted]);

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    closePanel();
    router.get(route("search"), { q: trimmed });
  }, [query, closePanel]);

  const goTo = useCallback(
    (suggestion: Suggestion) => {
      closePanel();
      setQuery(suggestion.name);
      if (suggestion.type === "category") {
        router.get(route("category.show", { category: suggestion.slug }));
      } else {
        router.get(`/product/${suggestion.slug}`);
      }
    },
    [closePanel],
  );

  const clearQuery = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    closePanel();
    inputRef.current?.focus();
  }, [closePanel]);

  const openRecentPanel = useCallback(() => {
    const r = readRecent();
    setRecent(r);
    if (r.length === 0) return;
    setShowRecent(true);
    setIsOpen(true);
    setSuggestions([]);
    setHighlighted(-1);
  }, []);

  const flatIndices = useCallback(() => {
    const cats = suggestions.filter((s) => s.type === "category");
    const prods = suggestions.filter((s) => s.type === "product");
    const rows: { suggestion: Suggestion; globalIndex: number }[] = [];
    let i = 0;
    for (const s of cats) {
      rows.push({ suggestion: s, globalIndex: i++ });
    }
    for (const s of prods) {
      rows.push({ suggestion: s, globalIndex: i++ });
    }
    const footerIndex = rows.length;
    return { rows, footerIndex };
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { rows, footerIndex } = flatIndices();
    const totalOptions = rows.length + 1;

    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      return;
    }

    if (!isOpen && !showRecent) {
      if (e.key === "Enter") handleSearch();
      return;
    }

    if (showRecent && !suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, recent.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, -1));
      } else if (e.key === "Enter" && highlighted >= 0 && recent[highlighted]) {
        e.preventDefault();
        setQuery(recent[highlighted]);
        setShowRecent(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, totalOptions - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < rows.length) {
        goTo(rows[highlighted].suggestion);
      } else if (highlighted === footerIndex) {
        handleSearch();
      } else {
        handleSearch();
      }
    }
  };

  const cats = suggestions.filter((s) => s.type === "category");
  const prods = suggestions.filter((s) => s.type === "product");
  const showEmpty =
    query.trim().length >= MIN_CHARS && !loading && !showRecent && suggestions.length === 0;
  const hasRecentBlock =
    showRecent && recent.length > 0 && query.trim().length < MIN_CHARS;
  const hasQueryBlock =
    query.trim().length >= MIN_CHARS && (loading || suggestions.length > 0 || showEmpty);
  const showPanel = isOpen && (hasRecentBlock || hasQueryBlock);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", mobile ? "w-full" : "w-full max-w-md", className)}
    >
      <div
        className={
          mobile
            ? "shop-search relative flex h-10 w-full items-center overflow-hidden rounded-xl bg-card shadow-[inset_0_0_0_1px_var(--border)]"
            : "shop-search relative flex h-10 w-full items-center overflow-hidden rounded-full bg-card shadow-[inset_0_0_0_1px_var(--border)]"
        }
      >
        {/* Single search icon — left affordance on mobile; desktop uses the round submit button only */}
        {mobile && (
          <Search
            className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-brand-muted"
            aria-hidden
          />
        )}
        {query.length > 0 && (
          <button
            type="button"
            onClick={clearQuery}
            className={
              mobile
                ? "absolute end-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-brand-muted hover:bg-muted hover:text-brand-text"
                : "absolute end-12 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-brand-muted hover:bg-muted hover:text-brand-text md:end-14"
            }
            aria-label={t("Clear search")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlighted >= 0 ? `${listId}-opt-${highlighted}` : undefined
          }
          aria-describedby={statusId}
          placeholder={mobile ? t("Search") : t("Search products, brands and categories")}
          dir="auto"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className={
            mobile
              ? "shop-search-input h-10 w-full rounded-none border-0 bg-transparent ps-9 pe-9 text-sm shadow-none ring-0 focus-visible:ring-0"
              : "shop-search-input h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent py-0 ps-4 pe-2 shadow-none ring-0 focus-visible:ring-0"
          }
          value={query}
          onChange={(e) => {
            setShowRecent(false);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const q = query.trim();
            if (q.length >= MIN_CHARS) {
              setShowRecent(false);
              setIsOpen(true);
              if (suggestions.length === 0 && !loading) {
                void fetchSuggestions(q);
              }
            } else {
              openRecentPanel();
            }
          }}
        />
        {!mobile && (
          <Button
            type="button"
            onClick={handleSearch}
            className="shop-search-submit relative z-10 size-10 shrink-0 rounded-full border-0 bg-primary p-0 text-primary-foreground shadow-none ring-0 hover:bg-brand-dark focus-visible:ring-0"
            aria-label={t("Search")}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
          </Button>
        )}
      </div>

      <div id={statusId} className="sr-only" aria-live="polite">
        {loading ? t("Search loading") : showPanel ? t("Search suggestions ready") : ""}
      </div>

      {showPanel && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute start-0 end-0 top-full z-[200] mt-1 max-h-[min(70vh,22rem)] overflow-y-auto overscroll-contain rounded-xl border border-brand-border bg-white text-start text-brand-text shadow-xl ring-1 ring-black/5"
        >
          {showRecent && recent.length > 0 && query.trim().length < MIN_CHARS && (
            <div className="border-b border-gray-100 py-1">
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t("Recent searches")}
                </span>
              </div>
              {recent.map((r, i) => (
                <button
                  key={`${r}-${i}`}
                  type="button"
                  id={`${listId}-opt-${i}`}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  role="option"
                  aria-selected={highlighted === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(r);
                    setShowRecent(false);
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-800 ${
                    highlighted === i ? "bg-brand-pink-soft" : "hover:bg-gray-50"
                  }`}
                >
                  <Search className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
              {t("Search loading")}
            </div>
          )}

          {!loading && showEmpty && (
            <div className="px-3 py-4 text-center">
              <p className="text-sm font-medium text-gray-700">{t("Search no suggestions")}</p>
              <p className="mt-1 text-xs text-gray-500">{t("Search press enter full")}</p>
            </div>
          )}

          {!loading && cats.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t("Categories")}
                </span>
              </div>
              {cats.map((s, i) => {
                const globalIndex = i;
                return (
                  <button
                    key={`cat-${s.id}`}
                    type="button"
                    id={`${listId}-opt-${globalIndex}`}
                    ref={(el) => {
                      optionRefs.current[globalIndex] = el;
                    }}
                    role="option"
                    aria-selected={highlighted === globalIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(s)}
                    onMouseEnter={() => setHighlighted(globalIndex)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 transition-colors ${
                      highlighted === globalIndex ? "bg-brand-pink-soft" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-pink-soft">
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-4 w-4 text-primary" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        <HighlightMatch text={s.name} query={query} />
                      </p>
                      <p className="text-xs text-gray-400">{t("Category")}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {!loading && prods.length > 0 && (
            <>
              <div className="border-t border-gray-100 px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t("Products")}
                </span>
              </div>
              {prods.map((s, i) => {
                const globalIndex = cats.length + i;
                return (
                  <button
                    key={`prod-${s.id}`}
                    type="button"
                    id={`${listId}-opt-${globalIndex}`}
                    ref={(el) => {
                      optionRefs.current[globalIndex] = el;
                    }}
                    role="option"
                    aria-selected={highlighted === globalIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(s)}
                    onMouseEnter={() => setHighlighted(globalIndex)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 transition-colors ${
                      highlighted === globalIndex ? "bg-brand-pink-soft" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="mx-auto mt-2 h-4 w-4 text-gray-400" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        <HighlightMatch text={s.name} query={query} />
                      </p>
                      {s.price !== undefined && (
                        <p className="text-xs font-medium text-primary">{formatPrice(s.price)}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {!loading && (suggestions.length > 0 || showEmpty) && query.trim().length >= MIN_CHARS && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                id={`${listId}-opt-${cats.length + prods.length}`}
                ref={(el) => {
                  optionRefs.current[cats.length + prods.length] = el;
                }}
                role="option"
                aria-selected={highlighted === cats.length + prods.length}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSearch}
                onMouseEnter={() => setHighlighted(cats.length + prods.length)}
                className={`flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-brand-pink-soft rtl:flex-row-reverse ${
                  highlighted === cats.length + prods.length ? "bg-brand-pink-soft" : ""
                }`}
              >
                <Search className="size-3.5 shrink-0" aria-hidden />
                <span>{`${t("See all results for")} "${query.trim()}"`}</span>
              </button>
            </div>
          )}

          {!loading && query.trim().length >= MIN_CHARS && (
            <p className="border-t border-gray-50 px-3 py-2 text-center text-[10px] text-gray-400">
              {t("Search keyboard hint")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
