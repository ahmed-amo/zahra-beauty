"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Heart,
  Package,
  UserCog,
  Menu,
  LayoutGrid,
  Tag,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, router, usePage } from "@inertiajs/react";
import ShoppingCartSheet from "@/components/ShopingCart";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/language-switcher";
import SearchAutocomplete from "@/components/Shop/SearchAutocomplete";
import CategorySubnavMarquee from "@/components/Shop/CategorySubnavMarquee";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import DarkModeToggle from "@/components/darkmode";

type NavCategory = {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  children?: NavCategory[];
};

export default function NavBarOne() {
  const { t, direction } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeNavCategoryId, setActiveNavCategoryId] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const page = usePage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = page.props as any;
  const { auth } = props;
  const navCategories: NavCategory[] = props.navCategories ?? [];
  const pageUrl = page.url;
  const user = auth.user;
  const isGuest = !user;
  const isAdmin = user?.role === "admin";
  const isClient = !isAdmin;
  const avatarUrl = user ? getAvatarUrl(user.picture ?? user.avatar) : null;
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : "U";
  const activeNavCategory =
    navCategories.find((c) => c.id === activeNavCategoryId) ?? null;
  const pathSlug = (() => {
    const match = pageUrl.split("?")[0].match(/\/category\/([^/]+)/);
    return match?.[1] ?? null;
  })();

  const handleLogout = () => {
    router.post(route("logout"));
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveNavCategoryId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const closeCategories = () => setActiveNavCategoryId(null);

  return (
    <header
      onMouseLeave={() => {
        if (!isMobileViewport) closeCategories();
      }}
      className="site-header sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0B0C] pt-[env(safe-area-inset-top)] text-white"
    >
      <div className="mx-auto w-full max-w-[1920px]">
        {/* Top bar — mobile matches desktop: search + bag stay visible top-right */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:gap-3 sm:px-4 md:min-h-[5.5rem] md:flex-nowrap md:justify-center md:gap-6 md:py-0 lg:gap-8">
          {/* Burger — mobile only */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative z-10 order-1 h-11 w-11 shrink-0 touch-manipulation rounded-full border-0 bg-transparent text-white hover:bg-white/10 md:order-none md:hidden"
                aria-label={t("Menu")}
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={direction === "rtl" ? "right" : "left"}
              overlayClassName="bg-zinc-900/40 backdrop-blur-sm"
              className="flex !w-[min(26rem,calc(100vw-0.75rem))] !max-w-none flex-col gap-0 border-brand-border bg-background p-0 text-foreground shadow-soft sm:!max-w-md"
            >
              <SheetHeader className="border-b border-brand-border/90 bg-background px-5 py-5">
                <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                  {t("Menu")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/products"
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-base font-semibold text-zinc-800 transition hover:border-primary/30 hover:bg-brand-pink-soft/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink-soft text-primary">
                      <ShoppingBag className="h-5 w-5" aria-hidden />
                    </span>
                    {t("Products")}
                  </Link>
                  <Link
                    href="/categories"
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-base font-semibold text-zinc-800 transition hover:border-primary/30 hover:bg-brand-pink-soft/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink-soft text-brand-dark">
                      <LayoutGrid className="h-5 w-5" aria-hidden />
                    </span>
                    {t("Categories")}
                  </Link>
                  <Link
                    href="/products"
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-base font-semibold text-zinc-800 transition hover:border-primary/30 hover:bg-brand-pink-soft/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink-soft text-primary">
                      <Tag className="h-5 w-5" aria-hidden />
                    </span>
                    {t("New collection")}
                  </Link>

                  {isAdmin && (
                    <Link
                      href={route("admin.dashboard")}
                      className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-base font-semibold text-primary transition hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                        <LayoutDashboard className="h-5 w-5" aria-hidden />
                      </span>
                      {t("Dashboard")}
                    </Link>
                  )}

                  {!isGuest && isClient && (
                    <Link
                      href="/client/dashboard"
                      className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-base font-semibold text-primary transition hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                        <LayoutDashboard className="h-5 w-5" aria-hidden />
                      </span>
                      {t("Dashboard")}
                    </Link>
                  )}

                  {isGuest && (
                    <Link
                      href={route("login")}
                      className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-base font-semibold text-zinc-800 transition hover:border-primary/30 hover:bg-brand-pink-soft/50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink-soft text-brand-dark">
                        <UserCog className="h-5 w-5" aria-hidden />
                      </span>
                      {t("Login")}
                    </Link>
                  )}
                </nav>

                {navCategories.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
                      {t("Shop by category")}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {navCategories.map((cat) => {
                        const children = cat.children ?? [];
                        const isExpanded = expandedCategory === cat.id;

                        if (children.length === 0) {
                          return (
                            <li key={cat.id}>
                              <Link
                                href={`/category/${cat.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-brand-pink-soft/60 hover:text-brand-dark"
                              >
                                <span>{cat.name}</span>
                                <ChevronRight className="h-4 w-4 text-zinc-400 rtl:rotate-180" />
                              </Link>
                            </li>
                          );
                        }

                        return (
                          <li key={cat.id}>
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm font-medium text-zinc-700 transition hover:bg-brand-pink-soft/60 hover:text-brand-dark"
                            >
                              <span>{cat.name}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden
                              />
                            </button>

                            {isExpanded && (
                              <ul className="mb-1 ms-3 flex flex-col gap-0.5 border-s border-brand-border ps-3">
                                <li>
                                  <Link
                                    href={`/category/${cat.slug}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-brand-pink-soft/60"
                                  >
                                    {t("All of :category", { category: cat.name })}
                                  </Link>
                                </li>
                                {children.map((child) => (
                                  <li key={child.id}>
                                    <Link
                                      href={`/category/${child.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-brand-pink-soft/60 hover:text-brand-dark"
                                    >
                                      {child.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-auto border-t border-brand-border pt-4">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="order-2 flex shrink-0 items-center md:order-none">
            <BrandLogo tone="on-dark" className="h-12 w-auto object-contain sm:h-14 md:h-16" />
          </Link>

          {/* Search — same control mobile + desktop, stays next to bag */}
          <div className="order-4 min-w-0 w-full basis-full md:order-none md:w-auto md:max-w-sm md:flex-1 md:basis-auto lg:max-w-md xl:max-w-lg">
            <SearchAutocomplete
              mobile={isMobileViewport}
              className="w-full max-w-none"
            />
          </div>

          {/* Desktop nav links — compact */}
          {isClient && (
            <nav className="hidden shrink-0 items-center gap-5 md:flex">
              <Link href="/products" className="text-[13px] font-medium text-white/80 hover:text-[#D9B08C]">
                {t("New collection")}
              </Link>
              <Link href="/category/robes" className="text-[13px] font-medium text-white/80 hover:text-[#D9B08C]">
                {t("Dresses")}
              </Link>
              <Link href="/category/accessoires" className="text-[13px] font-medium text-white/80 hover:text-[#D9B08C]">
                {t("Accessories")}
              </Link>
            </nav>
          )}

          {/* Actions — bag always top-right next to search (mobile = desktop) */}
          <div className="site-tools order-3 ms-auto flex shrink-0 items-center gap-1 sm:gap-2 md:order-none md:ms-0 md:gap-2">
            <div className="hidden shrink-0 md:flex md:items-center">
              <LanguageSwitcher />
            </div>
            <DarkModeToggle />

            <ShoppingCartSheet triggerClassName="h-10 w-10 shrink-0 sm:h-10 sm:w-10" />

            {isGuest && (
              <Link href={route("login")} className="hidden sm:block">
                <Button className="h-9 rounded-full px-4 text-sm text-white hover:bg-white/10 sm:h-10 sm:px-5" variant="ghost">
                  {t("Login")}
                </Button>
              </Link>
            )}

            {!isGuest && isAdmin && (
              <div className="hidden items-center gap-2 md:flex">
                <Link href={route("admin.dashboard")}>
                  <Button className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-white hover:bg-brand-dark">
                    <LayoutDashboard className="h-5 w-5" />
                    {t("Dashboard")}
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  className="flex items-center gap-2 rounded-2xl px-5 py-2"
                >
                  <LogOut className="h-5 w-5" />
                  {t("Logout")}
                </Button>
              </div>
            )}

            {!isGuest && isClient && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden rounded-full text-white hover:bg-white/10 md:flex">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-5xl p-8">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-bold">{t("Customer Support")}</DialogTitle>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 shrink-0 rounded-full p-0">
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                        <AvatarImage src={avatarUrl ?? undefined} alt={user.name} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel className="font-bold">{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/client/dashboard" className="flex cursor-pointer items-center gap-2">
                        <LayoutDashboard size={18} /> {t("Dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/client/my-orders" className="flex cursor-pointer items-center gap-2">
                        <Package size={18} /> {t("My Orders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/client/wishlist" className="flex cursor-pointer items-center gap-2">
                        <Heart size={18} /> {t("Wishlist")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/client/profile" className="flex cursor-pointer items-center gap-2">
                        <UserCog size={18} /> {t("Profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex cursor-pointer items-center gap-2">
                      <LogOut size={18} /> {t("Logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      {/* White category nav — sticky with header (mobile + desktop) */}
      {navCategories.length > 0 && (
        <div className="relative border-t border-white/10 bg-[#0B0B0C]">
          <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-4 lg:px-8">
            <nav
              aria-label={t("Categories")}
              className="overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="mx-auto flex w-max max-w-none items-center justify-center gap-1">
              {navCategories.map((cat) => {
                const open = activeNavCategoryId === cat.id;
                const hasChildren = (cat.children ?? []).length > 0;
                const onPage =
                  pathSlug === cat.slug ||
                  (cat.children ?? []).some((c) => c.slug === pathSlug);

                return (
                  <div
                    key={cat.id}
                    className="shrink-0"
                    onMouseEnter={() => {
                      if (!isMobileViewport && hasChildren) {
                        setActiveNavCategoryId(cat.id);
                      }
                    }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-haspopup="true"
                        onClick={() =>
                          setActiveNavCategoryId(open ? null : cat.id)
                        }
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:py-2 sm:text-sm",
                          open || onPage
                            ? "text-[#D9B08C]"
                            : "text-white/70 hover:text-white",
                        )}
                      >
                        {cat.name}
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform",
                            open && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={closeCategories}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:py-2 sm:text-sm",
                          onPage
                            ? "text-[#D9B08C]"
                            : "text-white/70 hover:text-white",
                        )}
                      >
                        {cat.name}
                      </Link>
                    )}
                  </div>
                );
              })}
              <Link
                href="/categories"
                onClick={closeCategories}
                className="shrink-0 px-2 py-1.5 text-xs font-medium text-[#D9B08C] hover:text-white sm:px-3 sm:py-2 sm:text-sm"
              >
                {t("View all categories")}
              </Link>
              </div>
            </nav>
          </div>

          {/* Dropdown: sous-catégories (mobile tap + desktop hover) */}
          {activeNavCategory && (activeNavCategory.children ?? []).length > 0 && (
            <>
              <button
                type="button"
                aria-label={t("Close")}
                className="fixed inset-0 z-[55] bg-black/20 md:hidden"
                onClick={closeCategories}
              />
              <div
                className="absolute inset-x-0 top-full z-[60] border-t border-brand-border bg-background shadow-soft"
                onMouseEnter={() => {
                  if (!isMobileViewport) setActiveNavCategoryId(activeNavCategory.id);
                }}
              >
              <div className="mx-auto w-full max-w-[1920px] px-3 py-3 sm:px-6 sm:py-5 lg:px-10">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
                  <Link
                    href={`/category/${activeNavCategory.slug}`}
                    onClick={closeCategories}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-brand-dark"
                  >
                    {t("View all :name", { name: activeNavCategory.name })}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={closeCategories}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-brand-muted hover:bg-zinc-50 hover:text-brand-dark md:hidden"
                  >
                    {t("Close")}
                  </button>
                </div>

                {/* Mobile: compact list of sous-catégories */}
                <ul className="grid max-h-[min(50vh,20rem)] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 md:hidden">
                  {(activeNavCategory.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/category/${child.slug}`}
                        onClick={closeCategories}
                        className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 text-sm font-medium text-brand-text transition hover:border-primary/25 hover:bg-brand-pink-soft/50"
                      >
                        <span className="truncate">{child.name}</span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-brand-muted rtl:rotate-180"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Desktop: image marquee */}
                <div className="hidden md:block">
                  <CategorySubnavMarquee
                    items={activeNavCategory.children ?? []}
                    onNavigate={closeCategories}
                  />
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
