import type { ReactNode } from "react";
import { Banknote, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function FeatureCard({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: typeof Truck;
  title: string;
  children: ReactNode;
  tone: "delivery" | "payment";
}) {
  const iconWrap =
    tone === "delivery"
      ? "bg-brand-pink-soft text-primary"
      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-foreground sm:text-lg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export default function ShopDeliveryTrust() {
  const { t } = useI18n();

  return (
    <section
      className="border-t border-border bg-muted/40 py-6 md:py-8"
      aria-label={t("Why shop with us")}
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-5 md:px-6">
        <div className="mb-5 text-center md:mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {t("Why shop with us")}
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground md:text-xl">
            {t("Trusted brands & easy shopping")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <FeatureCard icon={Truck} title={t("24h fast delivery")} tone="delivery">
            {t("delivery.fast.body")}
          </FeatureCard>
          <FeatureCard icon={Banknote} title={t("Cash on delivery")} tone="payment">
            {t("payment.cash.body")}
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
