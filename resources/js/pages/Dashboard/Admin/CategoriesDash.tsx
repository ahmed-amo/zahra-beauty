"use client"

import { Fragment, useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Pencil, Trash2, ChevronDown, ChevronRight, Plus, FolderPlus } from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { Link, usePage, router } from "@inertiajs/react"
import { useI18n } from "@/lib/i18n"
import { categoryImageSrc } from "@/lib/mediaUrl"
import CatalogGuide from "@/components/Admin/CatalogGuide"

interface Category {
  id: number
  parent_id?: number | null
  name: string
  slug: string
  description?: string | null
  status?: boolean
  sort_order?: number
  products_count?: number
  children_count?: number
  image?: string | null
  image_url?: string | null
  children?: Category[]
}

interface Paginated<T> {
  data: T[]
  links: { url: string | null; label: string; active: boolean }[]
  current_page?: number
  last_page?: number
  meta?: unknown
}

export default function CategoriesPage({
  categories,
  expandedParentId = null,
}: {
  categories: Paginated<Category>
  expandedParentId?: number | null
}) {
  const { t } = useI18n()
  const { props } = usePage<{ flash?: { success?: string; error?: string } }>()
  const [searchQuery, setSearchQuery] = useState("")
  const [flashMessage, setFlashMessage] = useState(props.flash?.success ?? "")
  const [flashError, setFlashError] = useState(props.flash?.error ?? "")
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    if (expandedParentId) initial.add(expandedParentId)
    return initial
  })

  useEffect(() => {
    if (expandedParentId) {
      setExpanded((prev) => new Set(prev).add(expandedParentId))
    }
  }, [expandedParentId])

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

  const parents = useMemo(() => categories?.data ?? [], [categories])

  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return parents

    const q = searchQuery.toLowerCase()
    const matches = (c: Category) =>
      c.name.toLowerCase().includes(q) || (c.slug?.toLowerCase().includes(q) ?? false)

    return parents.filter(
      (parent) => matches(parent) || (parent.children ?? []).some((child) => matches(child)),
    )
  }, [parents, searchQuery])

  useEffect(() => {
    if (!searchQuery.trim()) return
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const parent of filteredParents) {
        if ((parent.children ?? []).length > 0) next.add(parent.id)
      }
      return next
    })
  }, [searchQuery, filteredParents])

  const parentCount = filteredParents.length
  const childCount = filteredParents.reduce((sum, p) => sum + (p.children?.length ?? 0), 0)

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onDelete = (id: number) => {
    if (!confirm(t("Delete this category?"))) return
    router.delete(route("admin.categories.destroy", { category: id }))
  }

  const statusLabel = (active?: boolean) => (active ? t("Active") : t("Inactive"))

  const CategoryThumb = ({ category }: { category: Category }) => {
    const src = categoryImageSrc(category)
    return (
      <div className="h-10 w-10 overflow-hidden rounded-lg border border-border/60 bg-muted">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {flashMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-md border border-green-300 bg-green-100 p-3 text-sm font-medium text-green-800 shadow-sm"
          >
            {flashMessage}
          </motion.div>
        )}
        {flashError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-md border border-red-300 bg-red-100 p-3 text-sm font-medium text-red-800 shadow-sm"
          >
            {flashError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance text-3xl font-bold text-foreground">{t("Categories")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("categories.admin.subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("Search categories...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/admin/categories/add">
              <Button className="w-full gap-2 sm:w-auto">
                <FolderPlus className="h-4 w-4" />
                {t("Add Category")}
              </Button>
            </Link>
            <Link href="/admin/categories/add?mode=child">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("Add sub-category")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CatalogGuide variant="categories" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/categories/add"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary">
                {t("Add Category")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("guide.cta.root")}
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/categories/add?mode=child"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary">
                {t("Add sub-category")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("guide.cta.sub")}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">
            {t("categories.admin.count", {
              parents: parentCount,
              children: childCount,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">{t("No categories found.")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-10" />
                  <TableHead className="w-16">{t("Image")}</TableHead>
                  <TableHead>{t("Category Name")}</TableHead>
                  <TableHead>{t("Products")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParents.map((parent) => {
                  const children = parent.children ?? []
                  const hasChildren = children.length > 0
                  const isOpen = expanded.has(parent.id)

                  return (
                    <Fragment key={parent.id}>
                      <TableRow className="border-border bg-card">
                        <TableCell className="w-10 px-2">
                          {hasChildren ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggle(parent.id)}
                              aria-expanded={isOpen}
                              aria-label={isOpen ? t("Hide sub-categories") : t("Show sub-categories")}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                              )}
                            </Button>
                          ) : (
                            <span className="inline-block w-8" />
                          )}
                        </TableCell>
                        <TableCell>
                          <CategoryThumb category={parent} />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{parent.name}</span>
                            {hasChildren && (
                              <Badge variant="secondary" className="font-normal">
                                {t("categories.admin.subcount", { count: children.length })}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{parent.products_count ?? 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              parent.status
                                ? "border-green-200 bg-green-500/10 text-green-700"
                                : "border-gray-300 bg-gray-200 text-gray-700"
                            }
                          >
                            {statusLabel(parent.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/categories/add?mode=child&parent_id=${parent.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hidden gap-1.5 sm:inline-flex"
                                title={t("Add sub-category")}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {t("Add sub-category")}
                              </Button>
                            </Link>
                            <Link href={`/admin/categories/add?mode=child&parent_id=${parent.id}`} className="sm:hidden">
                              <Button variant="ghost" size="icon" aria-label={t("Add sub-category")} title={t("Add sub-category")}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/categories/${parent.id}/edit`}>
                              <Button variant="ghost" size="icon" aria-label={t("Edit")}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(parent.id)}
                              aria-label={t("Delete")}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {hasChildren &&
                        isOpen &&
                        children.map((child) => (
                          <TableRow
                            key={child.id}
                            className="border-border bg-muted/40"
                          >
                            <TableCell />
                            <TableCell>
                              <div className="ms-4">
                                <CategoryThumb category={child} />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <span className="ps-2">{child.name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{child.products_count ?? 0}</span>
                              <span className="ms-1 text-xs text-muted-foreground">{t("products")}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  child.status
                                    ? "border-green-200 bg-green-500/10 text-green-700"
                                    : "border-gray-300 bg-gray-200 text-gray-700"
                                }
                              >
                                {statusLabel(child.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/admin/categories/${child.id}/edit`}>
                                  <Button variant="ghost" size="icon" aria-label={t("Edit")}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDelete(child.id)}
                                  aria-label={t("Delete")}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {(categories.last_page ?? 1) > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.links
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

CategoriesPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
