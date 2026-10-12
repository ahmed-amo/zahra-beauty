import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { Check, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBirthListUiOptional } from "@/contexts/birthListUiContext";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BirthListOption = { id: number; name: string; items_count?: number; product_ids?: number[] };

type Props = {
  productId: number;
  className?: string;
  /** icon = compact overlay/side; paired = 30% next to cart; outline/default = labeled */
  variant?: "default" | "outline" | "icon" | "paired";
  size?: "default" | "sm" | "lg" | "icon";
};

export default function AddToBirthListButton({
  productId,
  className,
  variant = "outline",
  size = "default",
}: Props) {
  const { t } = useI18n();
  const [isTouch, setIsTouch] = useState(false);
  const page = usePage<{
    auth?: { user?: { id: number } | null };
    birthLists?: BirthListOption[];
  }>();
  const ui = useBirthListUiOptional();
  const user = page.props.auth?.user;
  const lists = ui?.lists ?? page.props.birthLists ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const inList =
    ui?.isProductInList(productId) ||
    lists.some((list) => list.product_ids?.includes(productId));

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none), (pointer: coarse)").matches);
  }, []);

  const tooltipLabel = (() => {
    if (!user) return t("Sign in to add to a birth list");
    if (lists.length === 0) return t("Create a birth list");
    if (lists.length === 1) return t("Add to :name", { name: lists[0].name });
    return t("Add to a birth list");
  })();

  const addToList = (birthListId: number) => {
    setPending(true);
    router.post(
      route("client.birth-lists.add-product"),
      { birth_list_id: birthListId, product_id: productId, quantity: 1 },
      {
        preserveScroll: true,
        onSuccess: () => {
          ui?.markProductInList(productId);
        },
        onFinish: () => {
          setPending(false);
          setPickerOpen(false);
        },
      },
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.visit(route("login"), {
        data: { redirect: window.location.pathname },
      });
      return;
    }

    if (lists.length === 0) {
      if (ui) {
        ui.openCreateDialog(productId);
      } else {
        router.visit(route("client.birth-lists.create"));
      }
      return;
    }

    if (lists.length === 1) {
      addToList(lists[0].id);
      return;
    }

    setPickerOpen(true);
  };

  const listPicker = (
    <ul className="space-y-2">
      {lists.map((list) => (
        <li key={list.id}>
          <button
            type="button"
            disabled={pending}
            onClick={() => addToList(list.id)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl border border-brand-border px-4 py-3 text-start text-sm font-medium transition hover:bg-brand-pink-soft disabled:opacity-60"
          >
            <span>{list.name}</span>
            {typeof list.items_count === "number" && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {list.items_count}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  const picker =
    isTouch ? (
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>{t("Choose a birth list")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {listPicker}
            {ui && (
              <button
                type="button"
                className="block w-full py-2 text-center text-sm font-semibold text-primary"
                onClick={() => {
                  setPickerOpen(false);
                  ui.openCreateDialog(productId);
                }}
              >
                {t("Create a new birth list")}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    ) : (
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Choose a birth list")}</DialogTitle>
          </DialogHeader>
          {listPicker}
          {ui && (
            <button
              type="button"
              className="block w-full py-2 text-center text-sm font-semibold text-primary"
              onClick={() => {
                setPickerOpen(false);
                ui.openCreateDialog(productId);
              }}
            >
              {t("Create a new birth list")}
            </button>
          )}
        </DialogContent>
      </Dialog>
    );

  const iconInner = pending ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : inList ? (
    <Check className="h-4 w-4" strokeWidth={2.5} />
  ) : (
    <Gift className="h-4 w-4" />
  );

  if (variant === "paired") {
    return (
      <>
        <Button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-label={tooltipLabel}
          title={tooltipLabel}
          className={cn(
            "flex h-full min-h-10 w-full flex-col items-center justify-center gap-0.5 rounded-none border-0 bg-white text-primary shadow-none ring-0",
            "hover:bg-brand-pink-soft focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary/40",
            inList && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
            className,
          )}
        >
          {iconInner}
          <span className="max-w-full truncate px-1 text-[10px] font-semibold leading-tight sm:text-[11px]">
            {inList ? t("Added!") : t("List")}
          </span>
        </Button>
        {picker}
      </>
    );
  }

  const iconButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={pending}
      aria-label={tooltipLabel}
      className={cn(
        "h-9 w-9 shrink-0 rounded-full text-primary hover:bg-primary/10 hover:text-primary",
        inList && "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600",
        className,
      )}
    >
      {iconInner}
    </Button>
  );

  const labeledButton = (
    <Button
      type="button"
      variant={variant === "default" ? "default" : "outline"}
      size={size === "icon" ? "default" : size}
      onClick={handleClick}
      disabled={pending}
      className={cn("gap-2", className)}
    >
      {iconInner}
      <span className="text-sm font-semibold">
        {inList ? t("Added to birth list") : t("Add to birth list")}
      </span>
    </Button>
  );

  const trigger = variant === "icon" ? iconButton : labeledButton;

  if (isTouch || variant !== "icon") {
    return (
      <>
        {trigger}
        {picker}
      </>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px]">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
      {picker}
    </>
  );
}
