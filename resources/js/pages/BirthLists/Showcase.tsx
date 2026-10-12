import { Link, router } from "@inertiajs/react";
import { Gift } from "lucide-react";
import ShopFrontLayout from "@/layouts/shop-layout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Pack = {
  id: number;
  name: string;
  slug: string;
  baby_type: string;
  baby_type_label: string;
  cover_image_url: string | null;
  items_count: number;
  is_featured: boolean;
  description: string | null;
};

type BabyType = { value: string; label: string };

type Props = {
  packs: Pack[];
  babyTypes: BabyType[];
  filters: { baby_type: string | null };
};

export default function BirthListsShowcase({ packs, babyTypes, filters }: Props) {
  const { t } = useI18n();

  return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("Packs")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-dark sm:text-4xl">
            {t("Ready for every little stage")}
          </h1>
          <p className="mt-3 text-brand-muted">
            {t("Curated packs for newborn, baby and toddler — pick one and make it yours")}
          </p>
          <Button asChild className="mt-5 rounded-xl">
            <Link href={route("client.birth-lists.index")}>{t("My birth lists")}</Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.get(route("birth-lists.showcase"))}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold",
              !filters.baby_type ? "bg-primary text-white" : "bg-zinc-100 text-brand-text hover:bg-zinc-200",
            )}
          >
            {t("All")}
          </button>
          {babyTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                router.get(
                  route("birth-lists.showcase"),
                  { baby_type: type.value },
                  { preserveState: true },
                )
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold",
                filters.baby_type === type.value
                  ? "bg-primary text-white"
                  : "bg-zinc-100 text-brand-text hover:bg-zinc-200",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {packs.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-16 text-center text-brand-muted">
            {t("No packs published yet")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <Link
                key={pack.id}
                href={route("birth-lists.packs.show", pack.slug)}
                className="group overflow-hidden rounded-[1.75rem] border border-brand-border bg-white transition hover:shadow-soft"
              >
                <div className="aspect-[4/3] bg-brand-pink-soft">
                  {pack.cover_image_url ? (
                    <img
                      src={pack.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gift className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">
                      {pack.baby_type_label}
                    </span>
                    {pack.is_featured && (
                      <span className="rounded-full bg-brand-pink-soft px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                        {t("Featured")}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-brand-dark">{pack.name}</h2>
                  <p className="text-sm text-brand-muted">
                    {t(":count items", { count: pack.items_count })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
  );
}

BirthListsShowcase.layout = (page: React.ReactNode) => (
  <ShopFrontLayout>{page}</ShopFrontLayout>
);
