import { FolderTree, Layers3, Package, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

interface CatalogGuideProps {
  variant?: "categories" | "product" | "compact"
  className?: string
}

/**
 * In-admin teaching aid for stock managers: category vs product vs variant.
 */
export default function CatalogGuide({
  variant = "categories",
  className,
}: CatalogGuideProps) {
  const { t } = useI18n()

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground dark:bg-primary/10",
          className,
        )}
      >
        <p className="font-semibold">{t("guide.product.title")}</p>
        <p className="mt-1 text-muted-foreground">{t("guide.product.body")}</p>
      </div>
    )
  }

  const cards =
    variant === "product"
      ? [
          {
            icon: FolderTree,
            title: t("guide.step.category"),
            body: t("guide.step.category.body"),
          },
          {
            icon: Package,
            title: t("guide.step.product"),
            body: t("guide.step.product.body"),
          },
          {
            icon: Layers3,
            title: t("guide.step.variant"),
            body: t("guide.step.variant.body"),
          },
        ]
      : [
          {
            icon: FolderTree,
            title: t("guide.cat.root"),
            body: t("guide.cat.root.body"),
          },
          {
            icon: Tag,
            title: t("guide.cat.sub"),
            body: t("guide.cat.sub.body"),
          },
          {
            icon: Package,
            title: t("guide.cat.product"),
            body: t("guide.cat.product.body"),
          },
        ]

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          {variant === "product" ? t("guide.how.title.product") : t("guide.how.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {variant === "product" ? t("guide.how.subtitle.product") : t("guide.how.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-border/80 bg-muted/30 p-3 dark:bg-muted/15"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/10">
        <span className="font-semibold text-foreground">{t("guide.example.label")} </span>
        {t("guide.example.body")}
      </div>
    </div>
  )
}
