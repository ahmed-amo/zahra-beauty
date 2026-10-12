import { Link } from "@inertiajs/react";
import { ArrowRight, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type HomePack = {
  id: number;
  name: string;
  slug: string;
  baby_type: string;
  baby_type_label: string;
  description: string | null;
  cover_image_url: string | null;
  items_count: number;
  is_featured: boolean;
};

type Props = {
  packs: HomePack[];
};

const typeAccent: Record<string, string> = {
  newborn: "from-[#f8e9ef] via-white to-[#eef4fb]",
  baby: "from-[#eef4fb] via-white to-[#f3efe8]",
  toddler: "from-[#f3efe8] via-white to-[#f8e9ef]",
};

export default function ShopHomePacks({ packs }: Props) {
  const { t, direction } = useI18n();

  if (!packs.length) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-y border-brand-border/60 bg-gradient-to-b from-white via-[#fbf7f9] to-white py-12 md:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(232,160,184,0.25), transparent 42%), radial-gradient(circle at 88% 70%, rgba(46,111,199,0.12), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t("Packs")}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl">
              {t("Ready for every little stage")}
            </h2>
            <p className="mt-2 text-sm text-brand-muted sm:text-base">
              {t("Curated packs for newborn, baby and toddler — pick one and make it yours")}
            </p>
          </div>
          <Link
            href={route("birth-lists.showcase")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-brand-dark"
          >
            {t("View all packs")}
            <ArrowRight className={cn("h-4 w-4", direction === "rtl" && "rotate-180")} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
            >
              <Link
                href={route("birth-lists.packs.show", pack.slug)}
                className="group block overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_18px_50px_-28px_rgba(40,40,60,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(40,40,60,0.55)]"
              >
                <div
                  className={cn(
                    "relative aspect-[5/4] overflow-hidden bg-gradient-to-br",
                    typeAccent[pack.baby_type] ?? typeAccent.newborn,
                  )}
                >
                  {pack.cover_image_url ? (
                    <img
                      src={pack.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gift className="h-14 w-14 text-primary/35" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-4 pt-16">
                    <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-dark shadow-sm">
                      {pack.baby_type_label}
                    </span>
                  </div>
                  {pack.is_featured && (
                    <span className="absolute end-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                      {t("Featured")}
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="text-xl font-semibold tracking-tight text-brand-dark transition group-hover:text-primary">
                    {pack.name}
                  </h3>
                  {pack.description && (
                    <p className="line-clamp-2 text-sm text-brand-muted">{pack.description}</p>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    {t(":count items", { count: pack.items_count })}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
