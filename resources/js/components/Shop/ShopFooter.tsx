import { Link } from "@inertiajs/react";
import { useI18n } from "@/lib/i18n";
import BrandLogo from "@/components/BrandLogo";

export default function FooterV2() {
  const { t, direction } = useI18n();

  return (
    <footer dir={direction} className="mt-16 w-full bg-[#111111] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
        <div className="space-y-4">
          <BrandLogo tone="on-dark" className="h-16 w-auto object-contain" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            {t("Modest luxury womenswear. Timeless dresses, abayas, and accessories.")}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B08C]">{t("Shop")}</h3>
          <nav className="flex flex-col gap-2 text-sm text-white/80">
            <Link href="/" className="hover:text-white">{t("Home")}</Link>
            <Link href="/products" className="hover:text-white">{t("New collection")}</Link>
            <Link href="/category/robes" className="hover:text-white">{t("Dresses")}</Link>
            <Link href="/category/abayas" className="hover:text-white">Abayas</Link>
            <Link href="/category/hijabs" className="hover:text-white">Hijabs</Link>
          </nav>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#D9B08C]">{t("Maison")}</h3>
          <p className="text-sm text-white/80">hello@zahra.style</p>
          <p className="text-sm text-white/80">Algeria</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto px-4 py-5 text-center text-xs tracking-wide text-white/50">
          © {new Date().getFullYear()} Zahra. {t("All rights reserved.")}
        </div>
      </div>
    </footer>
  );
}
