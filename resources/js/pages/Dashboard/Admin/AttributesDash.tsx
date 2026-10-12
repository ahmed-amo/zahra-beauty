"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Pencil,
  Trash2,
  Plus,
  Globe2,
  Tags,
  Palette,
  ChevronDown,
} from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { Link, usePage, router } from "@inertiajs/react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface AttributeValue {
  id: number
  value: string
  hex_color: string | null
}

interface LinkedProduct {
  id: number
  name: string
  slug: string
  source: "variant" | "category"
}

interface AttributeRow {
  id: number
  name: string
  sort_order: number
  is_active: boolean
  is_global: boolean
  values_count: number
  values: AttributeValue[]
  categories: { id: number; name: string }[]
  products: LinkedProduct[]
  products_count: number
}

interface Paginated<T> {
  data: T[]
  links: { url: string | null; label: string; active: boolean }[]
}

type Tab = "all" | "global" | "specific"

export default function AttributesPage({ attributes }: { attributes: Paginated<AttributeRow> }) {
  const { t } = useI18n()
  const { props } = usePage<{ flash?: { success?: string; error?: string } }>()
  const [searchQuery, setSearchQuery] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [flashMessage, setFlashMessage] = useState(props.flash?.success ?? "")
  const [flashError, setFlashError] = useState(props.flash?.error ?? "")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (props.flash?.success) setFlashMessage(props.flash.success)
    if (props.flash?.error) setFlashError(props.flash.error)
  }, [props.flash?.success, props.flash?.error])

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [flashMessage])

  useEffect(() => {
    if (flashError) {
      const timer = setTimeout(() => setFlashError(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [flashError])

  const rows = attributes?.data ?? []

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return rows.filter((row) => {
      if (tab === "global" && !row.is_global) return false
      if (tab === "specific" && row.is_global) return false
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        row.categories.some((c) => c.name.toLowerCase().includes(q)) ||
        row.values.some((v) => v.value.toLowerCase().includes(q)) ||
        row.products.some((p) => p.name.toLowerCase().includes(q))
      )
    })
  }, [rows, searchQuery, tab])

  const globalCount = rows.filter((r) => r.is_global).length
  const specificCount = rows.filter((r) => !r.is_global).length

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onDelete = (id: number) => {
    if (!confirm(t("Delete this attribute?"))) return
    router.delete(route("admin.attributes.destroy", id))
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {flashMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
          >
            {flashMessage}
          </motion.div>
        ) : null}
        {flashError ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {flashError}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("Attributes")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("attr.admin.subtitle")}</p>
        </div>
        <Link href="/admin/attributes/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("Add Attribute")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
            <Globe2 className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground">{t("attr.type.global")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("attr.type.global.help")}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{globalCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Tags className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground">{t("attr.type.specific")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("attr.type.specific.help")}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{specificCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {(
            [
              ["all", t("All"), rows.length],
              ["global", t("attr.type.global"), globalCount],
              ["specific", t("attr.type.specific"), specificCount],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}{" "}
              <span className="tabular-nums text-muted-foreground">({count})</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search attributes...")}
            className="ps-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            {t("No attributes found.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((attr) => {
            const open = expanded.has(attr.id)
            return (
              <Card
                key={attr.id}
                className={cn(
                  "overflow-hidden border-border shadow-sm transition hover:shadow-md",
                  attr.is_global && "ring-1 ring-sky-500/20",
                )}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            attr.is_global
                              ? "border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:text-sky-300"
                              : "border-violet-200 bg-violet-500/10 text-violet-700 dark:border-violet-800 dark:text-violet-300"
                          }
                        >
                          {attr.is_global ? (
                            <span className="inline-flex items-center gap-1">
                              <Globe2 className="h-3 w-3" />
                              {t("attr.badge.global")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Tags className="h-3 w-3" />
                              {t("attr.badge.specific")}
                            </span>
                          )}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            attr.is_active
                              ? "border-green-200 bg-green-500/10 text-green-700"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {attr.is_active ? t("Active") : t("Inactive")}
                        </Badge>
                      </div>
                      <CardTitle className="truncate text-lg">{attr.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attr.is_global
                          ? t("attr.card.global.hint")
                          : attr.categories.length > 0
                            ? t("attr.card.categories", { count: attr.categories.length })
                            : t("attr.card.no_categories")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Link href={`/admin/attributes/${attr.id}/edit`}>
                        <Button variant="ghost" size="icon" aria-label={t("Edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(attr.id)}
                        aria-label={t("Delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values.slice(0, 8).map((v) => (
                      <Badge
                        key={v.id}
                        variant="outline"
                        className="gap-1.5 rounded-lg border-border bg-muted/40 font-normal"
                      >
                        {v.hex_color ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: v.hex_color }}
                          />
                        ) : (
                          <Palette className="h-3 w-3 text-muted-foreground" />
                        )}
                        {v.value}
                      </Badge>
                    ))}
                    {attr.values.length > 8 ? (
                      <Badge variant="secondary" className="font-normal">
                        +{attr.values.length - 8}
                      </Badge>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(attr.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/50"
                  >
                    <span>
                      {attr.values_count} {t("values")} · {attr.products_count}{" "}
                      {t("products")}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition", open && "rotate-180")}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
                          {!attr.is_global && attr.categories.length > 0 ? (
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("Categories")}
                              </p>
                              <p className="text-foreground">
                                {attr.categories.map((c) => c.name).join(", ")}
                              </p>
                            </div>
                          ) : null}
                          {attr.products.length > 0 ? (
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("Products")}
                              </p>
                              <ul className="space-y-1">
                                {attr.products.slice(0, 6).map((p) => (
                                  <li key={p.id} className="truncate text-foreground">
                                    {p.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">{t("attr.card.no_products")}</p>
                          )}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {(attributes.links?.filter((l) => l.url).length ?? 0) > 2 ? (
        <div className="flex flex-wrap gap-2">
          {attributes.links
            ?.filter((link) => link.url)
            .map((link, i) => (
              <Link key={`${link.label}-${i}`} href={link.url!}>
                <Button size="sm" variant={link.active ? "default" : "outline"}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: link.label.replace("&laquo;", "«").replace("&raquo;", "»"),
                    }}
                  />
                </Button>
              </Link>
            ))}
        </div>
      ) : null}
    </div>
  )
}

AttributesPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
