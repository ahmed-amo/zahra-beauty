import { Link, router } from "@inertiajs/react";
import { Gift, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../Layouts/admin-layout";
import { useI18n } from "@/lib/i18n";

type Pack = {
  id: number;
  name: string;
  slug: string;
  baby_type: string;
  baby_type_label: string;
  items_count: number;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  cover_image_url: string | null;
};

export default function BirthListPacksIndex({ packs }: { packs: Pack[] }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("Packs")}</h1>
          <p className="text-muted-foreground">
            {t("Curated packs shown on the homepage and birth lists showcase")}
          </p>
        </div>
        <Button asChild>
          <Link href={route("admin.birth-list-packs.create")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("New pack")}
          </Link>
        </Button>
      </div>

      {packs.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Gift className="h-10 w-10 text-primary" />
            <p className="font-semibold">{t("No packs yet")}</p>
            <Button asChild>
              <Link href={route("admin.birth-list-packs.create")}>{t("New pack")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <Card key={pack.id} className="overflow-hidden rounded-2xl">
              <div className="aspect-[16/9] bg-muted">
                {pack.cover_image_url ? (
                  <img src={pack.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{pack.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {pack.baby_type_label} · {t(":count items", { count: pack.items_count })}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase">
                    {pack.is_published ? t("Published") : t("Draft")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={route("admin.birth-list-packs.edit", pack.slug)}>{t("Edit")}</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => {
                      if (confirm(t("Delete this pack?"))) {
                        router.delete(route("admin.birth-list-packs.destroy", pack.slug));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

BirthListPacksIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
