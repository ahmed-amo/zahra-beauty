import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  ExternalLink,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import ClientLayout from "../../Layouts/client-layout";
import { useI18n } from "@/lib/i18n";
import { formatDA } from "@/lib/currency";
import { cn } from "@/lib/utils";

type ListItem = {
  id: number;
  quantity: number;
  status: string;
  allow_cagnotte: boolean;
  product_unavailable: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  } | null;
  cagnotte: { contributed: number; target: number; progress: number };
};

type ListDetail = {
  id: number;
  name: string;
  baby_birth_date: string;
  baby_first_name: string | null;
  visibility: string;
  is_shared: boolean;
  share_url: string;
  items: ListItem[];
};

export default function BirthListShow({ list }: { list: ListDetail }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const toggleShare = (shared: boolean) => {
    router.post(route("client.birth-lists.share", list.id), {
      visibility: shared ? "shared" : "private",
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(list.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel = (status: string) => {
    if (status === "gifted") return t("Gifted");
    if (status === "reserved") return t("Reserved");
    return t("Available");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={route("client.birth-lists.index")}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("My birth lists")}
          </Link>
          <h1 className="text-3xl font-bold">{list.name}</h1>
          {list.baby_first_name && (
            <p className="text-muted-foreground">{list.baby_first_name}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={route("client.birth-lists.edit", list.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("Edit")}
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              if (confirm(t("Delete this birth list?"))) {
                router.delete(route("client.birth-lists.destroy", list.id));
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("Delete")}
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">{t("Sharing")}</p>
              <p className="text-sm text-muted-foreground">
                {list.is_shared
                  ? t("Anyone with the link can view and gift")
                  : t("Private — only you can see this list")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={list.is_shared ? "outline" : "default"}
              className="rounded-xl"
              onClick={() => toggleShare(!list.is_shared)}
            >
              {list.is_shared ? t("Make private") : t("Activate sharing")}
            </Button>
            {list.is_shared && (
              <>
                <Button type="button" variant="outline" className="rounded-xl" onClick={copyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? t("Copied!") : t("Copy link")}
                </Button>
                <Button asChild variant="ghost" className="rounded-xl">
                  <a href={list.share_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("Open")}
                  </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("Items")}</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/products">{t("Browse products")}</Link>
        </Button>
      </div>

      {list.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {t("Add products from the catalog with “Add to birth list”")}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 sm:flex-row sm:items-center dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {item.product?.image_url && (
                    <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={item.product ? `/product/${item.product.slug}` : "#"}
                    className="font-semibold hover:text-primary"
                  >
                    {item.product?.name ?? t("Product unavailable")}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {item.product ? formatDA(item.product.price) : "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        item.status === "gifted" && "bg-green-100 text-green-800",
                        item.status === "reserved" && "bg-amber-100 text-amber-800",
                        item.status === "available" && "bg-zinc-100 text-zinc-700",
                      )}
                    >
                      {statusLabel(item.status)}
                    </span>
                    {item.product_unavailable && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        {t("Product unavailable")}
                      </span>
                    )}
                    {item.allow_cagnotte && (
                      <span className="text-xs text-muted-foreground">
                        {t("Cagnotte")}: {formatDA(item.cagnotte.contributed)} /{" "}
                        {formatDA(item.cagnotte.target)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  className="h-9 w-20 rounded-xl"
                  defaultValue={item.quantity}
                  onBlur={(e) => {
                    const qty = Number(e.target.value);
                    if (qty >= 1 && qty !== item.quantity) {
                      router.post(route("client.birth-lists.items.update", [list.id, item.id]), {
                        quantity: qty,
                      });
                    }
                  }}
                />
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={item.allow_cagnotte}
                    onCheckedChange={(v) =>
                      router.post(route("client.birth-lists.items.update", [list.id, item.id]), {
                        allow_cagnotte: Boolean(v),
                      })
                    }
                  />
                  {t("Cagnotte")}
                </label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    router.post(route("client.birth-lists.items.move", [list.id, item.id]), {
                      direction: "up",
                    })
                  }
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    router.post(route("client.birth-lists.items.move", [list.id, item.id]), {
                      direction: "down",
                    })
                  }
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() =>
                    router.delete(route("client.birth-lists.items.destroy", [list.id, item.id]))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

BirthListShow.layout = (page: React.ReactNode) => <ClientLayout>{page}</ClientLayout>;
