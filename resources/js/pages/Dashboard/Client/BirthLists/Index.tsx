import { Link, usePage } from "@inertiajs/react";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ClientLayout from "../../Layouts/client-layout";
import { useI18n } from "@/lib/i18n";

type ListSummary = {
  id: number;
  name: string;
  baby_birth_date: string;
  baby_first_name: string | null;
  visibility: string;
  is_shared: boolean;
  items_count: number;
  share_url: string;
  cover_image_url: string | null;
};

export default function BirthListsIndex({ lists }: { lists: ListSummary[] }) {
  const { t } = useI18n();
  const flash = (usePage().props as { flash?: { success?: string } }).flash;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("My birth lists")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("Create and share gift lists for your little one")}
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href={route("client.birth-lists.create")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("Create birth list")}
          </Link>
        </Button>
      </div>

      {flash?.success && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {flash.success}
        </p>
      )}

      {lists.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Gift className="h-10 w-10 text-primary" />
            <p className="font-semibold">{t("No birth lists yet")}</p>
            <Button asChild>
              <Link href={route("client.birth-lists.create")}>{t("Create birth list")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} href={route("client.birth-lists.show", list.id)} className="block">
              <Card className="overflow-hidden rounded-2xl transition hover:shadow-md">
                <div className="aspect-[16/9] bg-brand-pink-soft">
                  {list.cover_image_url ? (
                    <img
                      src={list.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gift className="h-8 w-8 text-primary/60" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-foreground">{list.name}</h2>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                      {list.is_shared ? t("Shared") : t("Private")}
                    </span>
                  </div>
                  {list.baby_first_name && (
                    <p className="text-sm text-muted-foreground">{list.baby_first_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {list.baby_first_name
                      ? `${list.baby_first_name} · ${t(":count items", { count: list.items_count })}`
                      : t(":count items", { count: list.items_count })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

BirthListsIndex.layout = (page: React.ReactNode) => <ClientLayout>{page}</ClientLayout>;
