import { router } from "@inertiajs/react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const locales = [
  { code: "fr" as const, label: "FR", name: "Français" },
  { code: "en" as const, label: "EN", name: "English" },
  { code: "ar" as const, label: "AR", name: "العربية" },
];

/** Always black labels — overrides ghost/dark/popover inheritance */
const ink =
  "text-zinc-900 hover:text-zinc-900 focus-visible:text-zinc-900 data-[state=open]:text-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-100 dark:focus-visible:text-zinc-100 dark:data-[state=open]:text-zinc-100";

export default function LanguageSwitcher() {
  const { locale, t, direction } = useI18n();
  const active =
    locales.find((item) => item.code === locale) ??
    locales.find((item) => item.code === "fr")!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={`${t("Language")}: ${active.name}`}
          className={cn(
            ink,
            "h-9 gap-1.5 rounded-full border border-transparent bg-transparent px-2 shadow-none sm:h-10 sm:gap-2 sm:px-3",
            "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
            "focus-visible:ring-1 focus-visible:ring-border focus-visible:ring-offset-0",
            "min-w-0 justify-between font-semibold sm:min-w-[4.25rem]",
            "[&>span:first-child]:text-start",
            "touch-manipulation",
            "data-[state=open]:bg-black/[0.06] dark:data-[state=open]:bg-white/[0.08]",
            "[&_svg]:text-zinc-900 dark:[&_svg]:text-zinc-100",
          )}
        >
          <span className={cn("flex items-center gap-1.5 sm:gap-2", ink)}>
            <Globe className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn("hidden tabular-nums tracking-tight sm:inline", ink)}>
              {active.label}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-900 opacity-100 sm:h-4 sm:w-4 dark:text-zinc-100",
              direction === "rtl" && "rotate-180",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[12rem] rounded-2xl border border-neutral-200 bg-white p-1.5 text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("Language")}
        </p>
        {locales.map((item) => {
          const isActive = item.code === locale;
          return (
            <DropdownMenuItem
              key={item.code}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                if (isActive) {
                  return;
                }
                router.post(route("locale.switch", { locale: item.code }));
              }}
              className={cn(
                "gap-3 rounded-xl px-2 py-2.5 text-start text-zinc-900 opacity-100 dark:text-zinc-100",
                "focus:bg-neutral-100 focus:text-zinc-900 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-zinc-900 dark:focus:bg-zinc-800 dark:focus:text-zinc-100 dark:data-[highlighted]:bg-zinc-800 dark:data-[highlighted]:text-zinc-100",
                isActive ? "cursor-default bg-neutral-100 dark:bg-zinc-800" : "cursor-pointer",
              )}
            >
              <Globe
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400",
                )}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col items-stretch gap-0 text-start">
                <span className="text-sm font-semibold leading-none text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.name}</span>
              </span>
              {isActive && (
                <Check className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
