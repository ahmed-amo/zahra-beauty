import type { VariantAttribute } from "@/components/Admin/VariantBuilder"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Globe2, Tags } from "lucide-react"

interface CategoryAttributesPreviewProps {
  attributes: (VariantAttribute & { is_global?: boolean })[]
  emptyLabel?: string
}

export default function CategoryAttributesPreview({
  attributes,
  emptyLabel,
}: CategoryAttributesPreviewProps) {
  const { t } = useI18n()

  if (attributes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyLabel ?? t("product.attributes.empty")}
      </p>
    )
  }

  const globals = attributes.filter((a) => a.is_global)
  const specific = attributes.filter((a) => !a.is_global)

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    items: (VariantAttribute & { is_global?: boolean })[],
  ) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon}
          {title}
        </p>
        {items.map((attr) => (
          <div
            key={attr.id}
            className="rounded-xl border border-border bg-muted/30 px-4 py-3 dark:bg-muted/20"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{attr.name}</p>
              <span className="text-xs text-muted-foreground">
                {attr.values.length} {t("values")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {attr.values.map((val) => (
                <Badge
                  key={val.id}
                  variant="outline"
                  className="gap-1.5 rounded-lg border-border bg-background font-normal"
                >
                  {val.hex_color ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: val.hex_color }}
                    />
                  ) : null}
                  {val.value}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {renderGroup(t("attr.type.global"), <Globe2 className="h-3.5 w-3.5" />, globals)}
      {renderGroup(t("attr.type.specific"), <Tags className="h-3.5 w-3.5" />, specific)}
    </div>
  )
}
