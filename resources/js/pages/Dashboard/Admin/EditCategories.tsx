"use client"

import type React from "react"
import { router, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, AlertCircle } from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { Link } from "@inertiajs/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from "@/lib/i18n"
import { categoryImageSrc } from "@/lib/mediaUrl"
import ImageUploadField from "@/components/Admin/ImageUploadField"
import { CategoryPicker, type CategoryTreeNode } from "@/components/Category"

interface Category {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  status: boolean
  sort_order: number
  image: string | null
  image_url?: string | null
  has_children: boolean
  attribute_ids?: number[]
}

interface AttributeOption {
  id: number
  name: string
}

interface PageProps {
  category: Category
  parentTree?: CategoryTreeNode[]
  allAttributes?: AttributeOption[]
  globalAttributes?: AttributeOption[]
  errors: Record<string, string>
  [key: string]: unknown
}

export default function EditCategoryPage() {
  const { t } = useI18n()
  const { category, parentTree = [], allAttributes = [], globalAttributes = [], errors } =
    usePage<PageProps>().props
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: true,
    parent_id: null as number | null,
    image: null as File | null,
    attribute_ids: [] as number[],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        status: category.status,
        parent_id: category.parent_id,
        image: null,
        attribute_ids: category.attribute_ids ?? [],
      })
      const preview = categoryImageSrc({
        image_url: category.image_url,
        image: category.image,
      })
      setImagePreview(preview)
    }
  }, [category])

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
  }

  const toggleAttribute = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      attribute_ids: checked
        ? [...prev.attribute_ids, id]
        : prev.attribute_ids.filter((aid) => aid !== id),
    }))
  }

  const removeImage = () => {
    setFormData({ ...formData, image: null })
    setImagePreview(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const submitData = new FormData()
    submitData.append("name", formData.name)
    submitData.append("description", formData.description || "")
    submitData.append("status", formData.status ? "1" : "0")
    if (formData.parent_id != null) {
      submitData.append("parent_id", String(formData.parent_id))
    }
    formData.attribute_ids.forEach((id) => {
      submitData.append("attribute_ids[]", String(id))
    })
    submitData.append("_method", "PUT")

    if (formData.image) {
      submitData.append("image", formData.image)
    }

    router.post(`/admin/categories/${category.id}`, submitData, {
      forceFormData: true,
      onError: () => {},
      onFinish: () => setIsSubmitting(false),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-balance text-3xl font-bold text-foreground">
            {t("Edit Category")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Update category information")}
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Category Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Category Name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("Enter category name")}
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <CategoryPicker
                  tree={parentTree}
                  value={formData.parent_id}
                  mode="any"
                  label={t("Parent category")}
                  placeholder={t("No parent (top-level)")}
                  allowClear
                  error={errors.parent_id ?? null}
                  modalTitle={t("Select parent category")}
                  modalDescription={t("Pick any category to nest under. Unlimited depth.")}
                  onChange={(id) => setFormData({ ...formData, parent_id: id })}
                />

                <div className="space-y-2">
                  <Label htmlFor="description">{t("Description")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("Enter category description")}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className={errors.description ? "border-red-500" : ""}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{t("Product attributes")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Attributes available when creating variants for products in this category.",
                      )}
                    </p>
                  </div>

                  {globalAttributes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("attr.type.global")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("attr.category.global_hint")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {globalAttributes.map((attr) => (
                          <span
                            key={attr.id}
                            className="rounded-lg border border-sky-200 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-800 dark:border-sky-800 dark:text-sky-200"
                          >
                            {attr.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("attr.type.specific")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("attr.category.specific_hint")}
                    </p>
                    {allAttributes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("No attributes yet. Create some under Attributes.")}
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {allAttributes.map((attribute) => (
                          <div key={attribute.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`attr-${attribute.id}`}
                              checked={formData.attribute_ids.includes(attribute.id)}
                              onCheckedChange={(checked) =>
                                toggleAttribute(attribute.id, checked === true)
                              }
                            />
                            <Label htmlFor={`attr-${attribute.id}`} className="font-normal">
                              {attribute.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full space-y-6 lg:w-80">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Category Image")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploadField
                  id="image"
                  previewUrl={imagePreview}
                  onChange={(files) => {
                    const file = files?.[0] ?? null
                    if (!file) return
                    setFormData({ ...formData, image: file })
                    const reader = new FileReader()
                    reader.onloadend = () =>
                      setImagePreview(reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                  onClear={removeImage}
                  error={errors.image}
                />
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("Updating...") : t("Update Category")}
                </Button>
                <Link href="/admin/categories">
                  <Button type="button" variant="outline" className="w-full">
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

EditCategoryPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
