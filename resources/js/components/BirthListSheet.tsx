import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, router } from "@inertiajs/react";
import { ArrowRight, Check, Gift, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useBirthListUi,
  type BirthListToastItem,
} from "@/contexts/birthListUiContext";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  triggerClassName?: string;
};

export default function BirthListSheet({ triggerClassName = "" }: Props) {
  const { t, direction, formatPrice } = useI18n();
  const sheetSide = direction === "rtl" ? "left" : "right";
  const {
    lists,
    totalItems,
    sheetOpen,
    setSheetOpen,
    activeListId,
    openSheet,
    toast,
    toastVisible,
    setToastVisible,
    createOpen,
    setCreateOpen,
    createProductId,
  } = useBirthListUi();

  const [items, setItems] = useState<BirthListToastItem[]>([]);
  const [listName, setListName] = useState("");
  const [itemsCount, setItemsCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;

  useEffect(() => {
    if (toast?.items) {
      setItems(toast.items);
      setListName(toast.list_name);
      setItemsCount(toast.items_count);
    }
  }, [toast]);

  useEffect(() => {
    if (!sheetOpen || !activeListId) return;

    let cancelled = false;
    setLoadingPreview(true);

    fetch(route("client.birth-lists.preview", activeListId), {
      headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.list) return;
        setListName(data.list.name);
        setItemsCount(data.list.items_count);
        setItems(data.list.items ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sheetOpen, activeListId]);

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreating(true);
    router.post(
      route("client.birth-lists.store"),
      {
        name: createName.trim(),
        product_id: createProductId ?? undefined,
        continue_shopping: true,
      },
      {
        preserveScroll: true,
        onFinish: () => setCreating(false),
        onSuccess: () => {
          setCreateOpen(false);
          setCreateName("");
        },
      },
    );
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("relative rounded-full hover:bg-brand-pink-soft", triggerClassName)}
            onClick={() => openSheet(activeListId ?? lists[0]?.id)}
            aria-label={t("My birth lists")}
          >
            <Gift className="h-5 w-5 text-black" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white tabular-nums">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side={sheetSide} className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b pb-4 text-start">
            <SheetTitle className="text-xl">
              {listName || activeList?.name || t("My birth lists")}
            </SheetTitle>
            {lists.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => openSheet(list.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      list.id === activeListId
                        ? "border-primary bg-primary text-white"
                        : "border-brand-border hover:bg-brand-pink-soft",
                    )}
                  >
                    {list.name}
                    {typeof list.items_count === "number" ? ` (${list.items_count})` : ""}
                  </button>
                ))}
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {loadingPreview ? (
              <div className="flex h-40 items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <Gift className="mb-4 h-14 w-14 text-slate-300" />
                <p className="text-lg font-medium">{t("Your birth list is empty")}</p>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  {t("Add products with the gift button next to Add to Cart")}
                </p>
              </div>
            ) : (
              <ul className="grid gap-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 rtl:flex-row-reverse">
                    <div className="aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Gift className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.product?.name ?? t("Product")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ×{item.quantity}
                        {item.product?.price != null
                          ? ` · ${formatPrice(item.product.price)}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex w-full flex-col gap-2">
              <p className="text-center text-xs text-slate-500">
                {itemsCount} {itemsCount === 1 ? t("item") : t("items")} · {listName || activeList?.name}
              </p>
              {activeListId ? (
                <Button asChild className="w-full bg-primary hover:bg-brand-dark">
                  <Link href={route("client.birth-lists.show", activeListId)}>
                    {t("Manage birth list")}
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setSheetOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  {t("Create a birth list")}
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Toast — same pattern as cart */}
      {typeof document !== "undefined" &&
        toast &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed bottom-6 z-[9999] w-[min(24rem,calc(100vw-1.5rem))] transition-all duration-300 ease-out",
              direction === "rtl" ? "left-6" : "right-6",
              toastVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
            aria-live="polite"
            aria-hidden={!toastVisible}
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl bg-gray-900 shadow-2xl",
                toastVisible ? "pointer-events-auto" : "pointer-events-none",
              )}
            >
              <div
                key={toastVisible ? "on" : "off"}
                className="h-0.5 bg-primary"
                style={{
                  animation: toastVisible ? "birth-list-toast-drain 4s linear forwards" : "none",
                  transformOrigin: direction === "rtl" ? "right" : "left",
                }}
              />
              <div className="flex items-center gap-3 px-4 py-3.5 rtl:flex-row-reverse">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-700">
                  {toast.product?.image_url ? (
                    <img
                      src={toast.product.image_url}
                      alt={toast.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Gift className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-start">
                  <div className="mb-0.5 flex items-center gap-1.5 rtl:flex-row-reverse">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-semibold text-green-400">
                      {t("Added to birth list")}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-white">
                    {toast.product?.name ?? toast.list_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {toast.list_name} · {toast.items_count}{" "}
                    {toast.items_count === 1 ? t("item") : t("items")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSheet(toast.list_id)}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-dark rtl:flex-row-reverse"
                >
                  {t("View list")}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => setToastVisible(false)}
                  className="flex-shrink-0 text-gray-500 transition-colors hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <style>{`
              @keyframes birth-list-toast-drain {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
              }
            `}</style>
          </div>,
          document.body,
        )}

      {/* Quick create — name only */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Create your birth list")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {createProductId
                ? t("Give your list a name — the product will be added right away.")
                : t("Give your list a name to start adding products.")}
            </p>
            <div className="space-y-2">
              <Label htmlFor="quick-list-name">{t("List name")}</Label>
              <Input
                id="quick-list-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t("e.g. Leo's birth list")}
                required
                maxLength={120}
                autoFocus
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" disabled={creating || !createName.trim()} className="w-full rounded-xl">
              {creating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("Saving…")}
                </>
              ) : createProductId ? (
                t("Create & add product")
              ) : (
                t("Create birth list")
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
