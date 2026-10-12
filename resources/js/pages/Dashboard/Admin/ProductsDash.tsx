"use client"

import { useEffect, useState } from "react"
import { router, usePage } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Eye, RefreshCw } from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { Link } from "@inertiajs/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle } from "lucide-react"
import { formatDA } from "@/lib/currency"
import { useI18n } from "@/lib/i18n"

interface Product {
  id: number
  name: string
  slug?: string
  category: string | null
  price: number
  stock: number
  status: "active" | "low stock" | "out of stock"
  image_url: string | null
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedProducts {
  data: Product[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  links: PaginationLink[]
}

interface Props {
  products: PaginatedProducts
  filters?: {
    search?: string
  }
}

const statusBadge = {
  active: "bg-green-500/10 text-green-700 border border-green-200",
  "low stock": "bg-brand-pink-soft0/10 text-brand-dark border border-brand-pink-light",
  "out of stock": "bg-red-500/10 text-red-700 border border-red-200",
}

export default function ProductsDash({ products, filters }: Props) {
  const { t } = useI18n()
  const { flash } = usePage<{ flash?: { success?: string }, errors?: Record<string, string> }>().props

  const [flashMessage, setFlashMessage] = useState(flash?.success || "")
  const [flashIsError, setFlashIsError] = useState(false)
  const [searchQuery, setSearchQuery] = useState(filters?.search ?? "")
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [flashMessage])

  useEffect(() => {
    setSearchQuery(filters?.search ?? "")
  }, [filters?.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchQuery.trim()
      const current = (filters?.search ?? "").trim()
      if (next === current) return

      router.get(
        route("admin.products"),
        next ? { search: next } : {},
        { preserveState: true, preserveScroll: true, replace: true },
      )
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery, filters?.search])

  const handleDelete = (id: number) => {
    if (!confirm(t("Delete this product forever?"))) return

    setIsDeleting(id)
    router.delete(route('admin.products.destroy', id), {
      onSuccess: () => {
        setFlashMessage(t("Product deleted successfully"))
        setFlashIsError(false)
      },
      onError: () => {
        setFlashMessage(t("Failed to delete product"))
        setFlashIsError(true)
      },
      onFinish: () => {
        setIsDeleting(null)
      }
    })
  }

  const statusLabel = (status: Product["status"]) => {
    if (status === "active") return t("Active")
    if (status === "low stock") return t("Low Stock")
    return t("Out of Stock")
  }

  const shownCount = products.data.length

  return (
    <div className="space-y-6">
      {flashMessage && (
        <Alert className={flashIsError ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertDescription className="flex items-center gap-2">
            {flashIsError ? (
              <>
                <XCircle className="h-4 w-4" />
                <span className="text-red-700">{flashMessage}</span>
              </>
            ) : (
              <span className="text-green-700 text-center">{flashMessage}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("Products")}</h1>
          <p className="text-sm text-muted-foreground">{t("products.admin.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by name, category...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => router.reload({ only: ['products'] })}
            title={t("Refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Link href={route('admin.products.create')}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t("Add Product")}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("products.admin.all_count", { shown: shownCount, total: products.total })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.data.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {searchQuery ? t("No products match your search.") : t("products.admin.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("Image")}</TableHead>
                    <TableHead>{t("Product")}</TableHead>
                    <TableHead>{t("Category")}</TableHead>
                    <TableHead>{t("Price")}</TableHead>
                    <TableHead>{t("Stock")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.data.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xs">
                            <span className="text-muted-foreground">{t("No image")}</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell className="font-semibold">{formatDA(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge[product.status]}>
                          {statusLabel(product.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={product.slug ? `/product/${product.slug}` : `/admin/products/${product.id}/edit`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            disabled={isDeleting === product.id}
                          >
                            {isDeleting === product.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {products.last_page > 1 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("products.admin.page_info", {
                  current: products.current_page,
                  last: products.last_page,
                  total: products.total,
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {products.links
                  .filter((link) => link.url)
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

ProductsDash.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
