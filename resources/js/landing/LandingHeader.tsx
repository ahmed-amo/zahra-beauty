import { useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Menu, Search, User, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/language-switcher";
import ShoppingCartSheet from "@/components/ShopingCart";
import { LANDING_BRAND, landingConfig } from "@/landing/landing.config";
import { useLandingI18n } from "@/landing/i18n";
import type { PageProps } from "@/types";

export default function LandingHeader() {
  const { t } = useLandingI18n();
  const theme = landingConfig.theme;
  const { auth } = usePage<PageProps>().props;
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const accountHref = auth?.user ? "/client/dashboard" : "/login";

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linksA = [
    ["/", t("nav.home")],
    ["/products", t("nav.shop")],
    ["/categories", t("nav.categories")],
    ["/products", t("nav.about")],
    ["/products", t("nav.blog")],
    ["/products", t("nav.contact")],
  ] as const;

  const linksB = [
    ["/products", t("nav.newIn")],
    ["/categories", t("nav.shop")],
    ["/categories", t("nav.collections")],
    ["/category/robes", t("nav.dresses")],
    ["/products", t("nav.tops")],
    ["/products", t("nav.bottoms")],
    ["/products", t("nav.sale")],
  ] as const;

  const links = theme === "b" ? linksB : linksA;

  return (
    <>
      <header className={`ld-header${stuck ? " is-stuck" : ""}`}>
        <div className="ld-wrap ld-header-row">
          <button type="button" className="ld-icon ld-burger" aria-label={t("menu")} onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <Link href="/" className="ld-logo" aria-label={LANDING_BRAND}>
            <BrandLogo tone={theme === "b" ? "on-light" : "on-dark"} className="ld-logo-img" />
          </Link>
          <nav className="ld-nav" aria-label={LANDING_BRAND}>
            {links.map(([href, label]) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="ld-tools">
            <span className="ld-lang-slot">
              <LanguageSwitcher />
            </span>
            <Link href="/products" className="ld-icon" aria-label={t("search")}>
              <Search />
            </Link>
            <Link href={accountHref} className="ld-icon ld-account" aria-label={t("account")}>
              <User />
            </Link>
            <span className="ld-cart">
              <ShoppingCartSheet triggerClassName="ld-cart-trigger" />
            </span>
          </div>
        </div>
      </header>

      {open && (
        <>
          <button type="button" className="ld-drawer-backdrop" aria-label={t("close")} onClick={() => setOpen(false)} />
          <div className="ld-drawer" role="dialog" aria-label={t("menu")}>
            <button type="button" className="ld-icon" aria-label={t("close")} onClick={() => setOpen(false)}>
              <X />
            </button>
            {links.map(([href, label]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
