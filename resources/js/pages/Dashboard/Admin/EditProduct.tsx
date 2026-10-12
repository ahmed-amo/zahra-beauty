"use client"

import { useState, FormEvent, useEffect, useMemo } from "react"
import { router, usePage } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Link } from '@inertiajs/react'
import AdminLayout from "../Layouts/admin-layout"
import { CategoryPicker, type CategoryTreeNode } from "@/components/Category"
import VariantBuilder, {
  type VariantAttribute,
  type VariantRow,
} from "@/components/Admin/VariantBuilder"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDA } from "@/lib/currency"
import ImageUploadField from "@/components/Admin/ImageUploadField"
import { useI18n } from "@/lib/i18n"

interface Product {
  id: number
  name: string
  brand?: string | null
  category_id: number | null
  price: number
  compare_at_price?: number | null
  sale_enabled?: boolean
  sale_price?: number | null
  sale_starts_at?: string | null
  sale_ends_at?: string | null
  stock: number
  description: string
  status: "active" | "low stock" | "out of stock"
  has_variants?: boolean
  variants?: VariantRow[]
  image_url: string | null
  gallery_images?: string[]
  hero_sort_order?: number | null
}

interface Props {
  product: Product
  categories: CategoryTreeNode[]
  attributesByCategory?: Record<string | number, VariantAttribute[]>
  errors: Record<string, string>
}

export default function EditProduct({
  product: initialProduct,
  categories,
  attributesByCategory = {},
  errors,
}: Props) {
  const { t } = useI18n()
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category_id: null as number | null,
    price: "",
    stock: "",
    description: "",
    status: "active" as "active" | "low stock" | "out of stock",
    sale_enabled: false,
    sale_price: "",
    sale_starts_at: "",
    sale_ends_at: "",
  })

  const [hasVariants, setHasVariants] = useState(false)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [replaceGallery, setReplaceGallery] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flashMessage, setFlashMessage] = useState(flash?.success || "")

  const categoryAttributes = useMemo(() => {
    if (!formData.category_id) return []
    return attributesByCategory[formData.category_id]
      ?? attributesByCategory[Number(formData.category_id)]
      ?? []
  }, [attributesByCategory, formData.category_id])

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || "",
        brand: initialProduct.brand || "",
        category_id: initialProduct.category_id ?? null,
        price: initialProduct.price.toString(),
        stock: initialProduct.stock.toString(),
        description: initialProduct.description || "",
        status: initialProduct.status || "active",
        sale_enabled: Boolean(initialProduct.sale_enabled),
        sale_price:
          initialProduct.sale_price != null && initialProduct.sale_price !== undefined
            ? String(initialProduct.sale_price)
            : "",
        sale_starts_at: initialProduct.sale_starts_at || "",
        sale_ends_at: initialProduct.sale_ends_at || "",
      })
      setHasVariants(Boolean(initialProduct.has_variants))
      setVariantRows(
        (initialProduct.variants ?? []).map((row) => ({
          ...row,
          attribute_value_ids: row.attribute_value_ids ?? [],
        })),
      )
      if (initialProduct.image_url) {
        setImagePreview(initialProduct.image_url)
      }
    }
  }, [initialProduct])

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [flashMessage])

  const removeImage = () => {
    setImage(null)
    setImagePreview(initialProduct.image_url || null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData()
    data.append('name', formData.name)
    data.append('brand', formData.brand)
    data.append('category_id', formData.category_id != null ? String(formData.category_id) : '')
    data.append('price', formData.price || '0')
    data.append('stock', hasVariants ? '0' : formData.stock)
    data.append('description', formData.description)
    data.append('has_variants', hasVariants ? '1' : '0')
    if (hasVariants) {
      data.append('variants', JSON.stringify(variantRows))
    }
    data.append('_method', 'PUT')
    data.append('sale_enabled', formData.sale_enabled ? '1' : '0')
    if (formData.sale_price.trim() !== "") {
      data.append('sale_price', formData.sale_price)
    }
    if (formData.sale_starts_at.trim() !== "") {
      data.append('sale_starts_at', formData.sale_starts_at)
    }
    if (formData.sale_ends_at.trim() !== "") {
      data.append('sale_ends_at', formData.sale_ends_at)
    }

    if (image) {
      data.append('image', image)
    }
    if (galleryImages.length > 0) {
      data.append('replace_gallery', replaceGallery ? '1' : '0')
      galleryImages.slice(0, 5).forEach((file) => data.append('gallery_images[]', file))
    }

    router.post(`/admin/products/${initialProduct.id}`, data, {
      forceFormData: true,
      onSuccess: () => {
        setFlashMessage(t("Product updated successfully!"))
      },
      onError: () => {},
      onFinish: () => {
        setIsSubmitting(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {flashMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">
            {flashMessage}
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">{t("Edit Product")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("products.edit.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Product Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Product Name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("Enter product name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={errors.name ? "border-red-500" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">{t("Brand")}</Label>
                  <Input
                    id="brand"
                    placeholder={t("brand.placeholder")}
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("Description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("Enter product description")}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <CategoryPicker
                  tree={categories ?? []}
                  value={formData.category_id}
                  mode="leaf"
                  required
                  error={errors.category_id}
                  placeholder={t("Choose category")}
                  onChange={(id) => {
                    setFormData({ ...formData, category_id: id })
                    setVariantRows([])
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Pricing & Inventory")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="has_variants"
                    checked={hasVariants}
                    onCheckedChange={(v) => {
                      const enabled = Boolean(v)
                      setHasVariants(enabled)
                      if (!enabled) setVariantRows([])
                    }}
                  />
                  <Label htmlFor="has_variants" className="cursor-pointer">
                    {t("Enable Variants")}
                  </Label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {hasVariants ? t("Base Price (DA)") : `${t("Price (DA)")} *`}
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required={!hasVariants}
                    />
                    {hasVariants && (
                      <p className="text-xs text-muted-foreground">
                        {t("product.variants.base_price_hint")}
                      </p>
                    )}
                  </div>

                  {!hasVariants ? (
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t("Stock Quantity")} *</Label>
                      <Input
                        id="stock"
                        type="number"
                        placeholder="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>{t("Stock")}</Label>
                      <Input value={t("Managed per variant")} readOnly className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        {t("product.variants.stock_hint")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {hasVariants && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("Variants")}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("product.variants.intro")}
                  </p>
                </CardHeader>
                <CardContent>
                  {!formData.category_id ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("product.variants.choose_category")}
                    </p>
                  ) : (
                    <VariantBuilder
                      key={formData.category_id}
                      attributes={categoryAttributes}
                      value={variantRows}
                      onChange={setVariantRows}
                      basePrice={parseFloat(formData.price) || 0}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Sales & pricing")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("product.sale.section_help")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sale_enabled"
                    checked={formData.sale_enabled}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, sale_enabled: Boolean(v) })
                    }
                  />
                  <Label htmlFor="sale_enabled" className="cursor-pointer">
                    {t("Enable scheduled sale")}
                  </Label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("Original (regular) price")}</Label>
                    <Input value={formData.price} readOnly className="bg-muted" aria-readonly />
                    <p className="text-xs text-muted-foreground">{t("product.sale.original_hint")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">{t("Sale price (DA)")}</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="1"
                      min="0"
                      placeholder={t("Discounted price (DA)")}
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      disabled={!formData.sale_enabled}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sale_starts_at">{t("Sale start (optional)")}</Label>
                    <Input
                      id="sale_starts_at"
                      type="datetime-local"
                      value={formData.sale_starts_at}
                      onChange={(e) => setFormData({ ...formData, sale_starts_at: e.target.value })}
                      disabled={!formData.sale_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_ends_at">{t("Sale end (optional)")}</Label>
                    <Input
                      id="sale_ends_at"
                      type="datetime-local"
                      value={formData.sale_ends_at}
                      onChange={(e) => setFormData({ ...formData, sale_ends_at: e.target.value })}
                      disabled={!formData.sale_enabled}
                    />
                  </div>
                </div>

                {formData.sale_enabled && formData.sale_price && parseFloat(formData.sale_price) > 0 && (
                  <div className="rounded-lg border border-dashed border-primary/40 bg-brand-pink-soft/60 p-4 dark:border-brand-dark dark:bg-brand-dark/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark dark:text-brand-pink-light">
                      {t("Storefront preview")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatDA(parseFloat(formData.price) || 0)}
                      </span>
                      <span className="text-lg font-bold text-brand-dark dark:text-brand-pink-light">
                        {formatDA(parseFloat(formData.sale_price) || 0)}
                      </span>
                      {parseFloat(formData.price) > 0 && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                          -
                          {Math.round(
                            ((parseFloat(formData.price) - parseFloat(formData.sale_price)) /
                              parseFloat(formData.price)) *
                              100
                          )}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Product Gallery (max 5)")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(initialProduct.gallery_images?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{t("Current gallery")}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {initialProduct.gallery_images?.slice(0, 5).map((url) => (
                        <img key={url} src={url} alt="" className="h-16 w-full rounded-md border object-cover" />
                      ))}
                    </div>
                  </div>
                ) : null}

                <ImageUploadField
                  id="image-upload"
                  accept="image/*"
                  label={t("Main product image")}
                  previewUrl={imagePreview}
                  fileName={image?.name ?? null}
                  onChange={(files) => {
                    const file = files?.[0] ?? null
                    if (!file) return
                    setImage(file)
                    const reader = new FileReader()
                    reader.onloadend = () => setImagePreview(reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                  onClear={removeImage}
                />

                <ImageUploadField
                  id="gallery-upload"
                  accept="image/*"
                  multiple
                  label={t("New gallery images")}
                  fileCount={galleryImages.length}
                  onChange={(files) =>
                    setGalleryImages(Array.from(files ?? []).slice(0, 5))
                  }
                  onClear={() => setGalleryImages([])}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="replace_gallery"
                    checked={replaceGallery}
                    onCheckedChange={(checked) => setReplaceGallery(checked === true)}
                  />
                  <Label htmlFor="replace_gallery">{t("Replace existing gallery")}</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || (hasVariants && variantRows.length === 0)}
                >
                  {isSubmitting ? t("Updating...") : t("Update Product")}
                </Button>
                <Link href="/admin/products" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    {t("Cancel")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

EditProduct.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
