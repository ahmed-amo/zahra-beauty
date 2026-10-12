import type { ReactNode } from "react";
import { Head } from "@inertiajs/react";
import AppProviders from "@/layouts/Provider";
import { useI18n } from "@/lib/i18n";
import { LANDING_BRAND, landingConfig } from "@/landing/landing.config";
import "../../css/landing.css";

export default function LandingLayout({ children }: { children: ReactNode }) {
  const { direction, locale } = useI18n();

  return (
    <AppProviders>
      <Head title={LANDING_BRAND}>
        <link
          rel="stylesheet"
          href="https://fonts.bunny.net/css?family=amiri:400,700|inter:400,500,600&display=swap"
        />
        <link rel="preload" as="image" href="/zahra/photos/robe-sauge.jpg" />
      </Head>
      <div
        className="zahra-landing"
        data-theme={landingConfig.theme}
        dir={direction}
        lang={locale}
      >
        {children}
      </div>
    </AppProviders>
  );
}
