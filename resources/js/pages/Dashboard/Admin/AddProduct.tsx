import { useMemo, useState, FormEvent } from "react"
import { Link, router, usePage } from "@inertiajs/react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ImageIcon,
  Layers3,
  Package,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AdminLayout from "../Layouts/admin-layout"
import {
  CategoryPicker,
  findCategoryNode,
  type CategoryTreeNode,
} from "@/components/Category"
import VariantBuilder, {
  type VariantAttribute,
  type VariantRow,
} from "@/components/Admin/VariantBuilder"
import ImageUploadField from "@/components/Admin/ImageUploadField"
import {
  CategoryAttributesPreview,
  ProductFormSection,
} from "@/components/Admin/ProductForm"
import CatalogGuide from "@/components/Admin/CatalogGuide"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface Props {
  categories: CategoryTreeNode[]
  attributesByCategory?: Record<string | number, VariantAttribute[]>
}

const SECTIONS = [
  { id: "general", icon: Package, labelKey: "General Information" },
  { id: "category", icon: Tag, labelKey: "Category" },
  { id: "images", icon: ImageIcon, labelKey: "Images" },
  { id: "pricing", icon: Layers3, labelKey: "Pricing" },
  { id: "inventory", icon: Package, labelKey: "Inventory" },
  { id: "variants", icon: Layers3, labelKey: "Variants" },
  { id: "attributes", icon: Tag, labelKey: "Custom Attributes" },
] as const

export default function AddProduct({ categories = [], attributesByCategory = {} }: Props) {
  const { t } = useI18n()
  const { errors } = usePage<{ errors?: Record<string, string> }>().props

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category_id: null as number | null,
    price: "",
    stock: "",
    description: "",
  })
  const [hasVariants, setHasVariants] = useState(false)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryTouched, setCategoryTouched] = useState(false)

  const selectedCategory = useMemo(
    () => findCategoryNode(categories, formData.category_id),
    [categories, formData.category_id],
  )

  const categoryAttributes = useMemo(() => {
    if (!formData.category_id) return []
    return (
      attributesByCategory[formData.category_id] ??
      attributesByCategory[String(formData.category_id)] ??
      []
    )
  }, [attributesByCategory, formData.category_id])

  const categoryError = useMemo(() => {
    if (!categoryTouched && !errors?.category_id) return null
    if (!formData.category_id) return t("Please select a category.")
    if (selectedCategory?.has_children) {
      return t("Please select a more specific category.")
    }
    return errors?.category_id ?? null
  }, [
    categoryTouched,
    errors?.category_id,
    formData.category_id,
    selectedCategory,
    t,
  ])

  const canSubmit =
    Boolean(formData.name.trim()) &&
    Boolean(formData.category_id) &&
    !selectedCategory?.has_children &&
    !(hasVariants && variantRows.length === 0)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setCategoryTouched(true)

    if (!formData.category_id || selectedCategory?.has_children) {
      return
    }

    setIsSubmitting(true)

    const data = new FormData()
    data.append("name", formData.name)
    data.append("brand", formData.brand)
    data.append("category_id", String(formData.category_id))
    data.append("price", formData.price || "0")
    data.append("stock", hasVariants ? "0" : formData.stock)
    data.append("description", formData.description)
    data.append("has_variants", hasVariants ? "1" : "0")
    if (hasVariants) {
      data.append("variants", JSON.stringify(variantRows))
    }
    if (image) data.append("image", image)
    galleryImages.slice(0, 5).forEach((file) => data.append("gallery_images[]", file))

    router.post(route("admin.products.store"), data, {
      onError: () => setIsSubmitting(false),
      onFinish: () => setIsSubmitting(false),
    })
  }

  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="mt-0.5 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
              {t("Add New Product")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("products.create.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:pt-1">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              {t("Cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            form="add-product-form"
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? t("Creating...") : t("Create Product")}
          </Button>
        </div>
      </div>

      {errors && Object.keys(errors).length > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-inside list-disc">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <form id="add-product-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
          {/* Section nav */}
          <nav className="hidden xl:block">
            <div className="sticky top-24 space-y-1 rounded-2xl border border-border bg-card/80 p-3 shadow-sm backdrop-blur">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Sections")}
              </p>
              {SECTIONS.map(({ id, icon: Icon, labelKey }) => (
                <a
                  key={id}
                  href={`#section-${id}`}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(labelKey)}</span>
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <ProductFormSection
                id="section-general"
                title={t("General Information")}
                description={t("product.section.general.desc")}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Product Name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("Enter product name")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">{t("Brand")}</Label>
                  <Input
                    id="brand"
                    placeholder={t("brand.placeholder")}
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("Description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("Enter product description")}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={5}
                    className="rounded-xl"
                  />
                </div>
              </ProductFormSection>

              <ProductFormSection
                id="section-category"
                title={t("Category")}
                description={t("product.section.category.desc")}
              >
                <CatalogGuide variant="compact" className="mb-4" />
                <CategoryPicker
                  tree={categories}
                  value={formData.category_id}
                  mode="leaf"
                  required
                  error={categoryError}
                  placeholder={t("Choose category")}
                  onChange={(id) => {
                    setCategoryTouched(true)
                    setFormData({ ...formData, category_id: id })
                    setVariantRows([])
                  }}
                />
              </ProductFormSection>

              <ProductFormSection
                id="section-images"
                title={t("Images")}
                description={t("product.section.images.desc")}
              >
                <ImageUploadField
                  id="gallery-upload"
                  accept="image/*"
                  multiple
                  fileCount={galleryImages.length}
                  onChange={(files) =>
                    setGalleryImages(Array.from(files ?? []).slice(0, 5))
                  }
                  onClear={() => setGalleryImages([])}
                  hint={t("Drag and drop or click to upload")}
                />
                <ImageUploadField
                  id="main-image-upload"
                  accept="image/*"
                  label={t("Main product image")}
                  previewUrl={imagePreview}
                  fileName={image?.name ?? null}
                  onChange={(files) => {
                    const file = files?.[0] ?? null
                    if (!file) return
                    setImage(file)
                    const reader = new FileReader()
                    reader.onloadend = () =>
                      setImagePreview(reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                  onClear={clearImage}
                />
              </ProductFormSection>

              <ProductFormSection
                id="section-pricing"
                title={t("Pricing")}
                description={t("product.section.pricing.desc")}
              >
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {hasVariants
                      ? t("Base Price (DA)")
                      : `${t("Price (DA)")} *`}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required={!hasVariants}
                    className="h-11 max-w-xs rounded-xl"
                  />
                  {hasVariants ? (
                    <p className="text-xs text-muted-foreground">
                      {t("product.variants.base_price_hint")}
                    </p>
                  ) : null}
                </div>
              </ProductFormSection>

              <ProductFormSection
                id="section-inventory"
                title={t("Inventory")}
                description={t("product.section.inventory.desc")}
              >
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3">
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

                {!hasVariants ? (
                  <div className="space-y-2">
                    <Label htmlFor="stock">{t("Stock Quantity")} *</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      required
                      className="h-11 max-w-xs rounded-xl"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("product.variants.stock_hint")}
                  </p>
                )}
              </ProductFormSection>

              <ProductFormSection
                id="section-variants"
                title={t("Variants")}
                description={t("product.variants.intro")}
                className={cn(!hasVariants && "opacity-60")}
              >
                {!hasVariants ? (
                  <p className="text-sm text-muted-foreground">
                    {t("product.variants.enable_first")}
                  </p>
                ) : !formData.category_id ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
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
              </ProductFormSection>

              <ProductFormSection
                id="section-attributes"
                title={t("Custom Attributes")}
                description={t("product.section.attributes.desc")}
              >
                {!formData.category_id ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("product.variants.choose_category")}
                  </p>
                ) : (
                  <CategoryAttributesPreview attributes={categoryAttributes} />
                )}
              </ProductFormSection>
            </motion.div>
          </div>

          {/* Sticky summary */}
          <aside className="space-y-4">
            <div className="sticky top-24 space-y-4">
              <ProductFormSection title={t("Summary")}>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("Category")}</dt>
                    <dd className="truncate font-medium text-foreground">
                      {selectedCategory?.name ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("Attributes")}</dt>
                    <dd className="font-medium text-foreground">
                      {categoryAttributes.length}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("Variants")}</dt>
                    <dd className="font-medium text-foreground">
                      {hasVariants ? variantRows.length : t("Simple")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("Images")}</dt>
                    <dd className="font-medium text-foreground">
                      {(image ? 1 : 0) + galleryImages.length}
                    </dd>
                  </div>
                </dl>
              </ProductFormSection>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting ? t("Creating...") : t("Create Product")}
                </Button>
                <Link href="/admin/products" className="mt-2 block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    {t("Cancel")}
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}

AddProduct.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
