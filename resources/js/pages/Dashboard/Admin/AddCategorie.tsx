"use client"

import type React from "react"
import { router, usePage } from "@inertiajs/react"
import { useState } from "react"
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
import ImageUploadField from "@/components/Admin/ImageUploadField"
import { CategoryPicker, type CategoryTreeNode } from "@/components/Category"
import CatalogGuide from "@/components/Admin/CatalogGuide"

interface AttributeOption {
  id: number
  name: string
}

export default function NewCategoryPage({
  parentTree = [],
  allAttributes = [],
  globalAttributes = [],
  mode = "parent",
  defaultParentId = null,
}: {
  parentTree?: CategoryTreeNode[]
  allAttributes?: AttributeOption[]
  globalAttributes?: AttributeOption[]
  mode?: "parent" | "child"
  defaultParentId?: number | null
}) {
  const { t } = useI18n()
  const { errors } = usePage().props
  const isChildMode = mode === "child"
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: true,
    parent_id: isChildMode && defaultParentId ? defaultParentId : (null as number | null),
    image: null as File | null,
    attribute_ids: [] as number[],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } else if (isChildMode) {
      submitData.append("parent_id", "")
    }
    formData.attribute_ids.forEach((id) => {
      submitData.append("attribute_ids[]", String(id))
    })
    if (formData.image) {
      submitData.append("image", formData.image)
    }

    router.post("/admin/categories/add", submitData, {
      forceFormData: true,
      onSuccess: () => {
        setFormData({
          name: "",
          description: "",
          status: true,
          parent_id: null,
          image: null,
          attribute_ids: [],
        })
        setImagePreview(null)
      },
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
            {isChildMode ? t("Add sub-category") : t("Add Category")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Create a category anywhere in the tree. Leave parent empty for a top-level category.")}
          </p>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{String(value)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <CatalogGuide variant="categories" />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, parent_id: null })}
          className={`rounded-2xl border p-4 text-start transition ${
            formData.parent_id == null
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <p className="font-semibold text-foreground">{t("guide.choice.root")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("guide.choice.root.body")}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            if (formData.parent_id == null && defaultParentId) {
              setFormData({ ...formData, parent_id: defaultParentId })
            }
          }}
          className={`rounded-2xl border p-4 text-start transition ${
            formData.parent_id != null
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <p className="font-semibold text-foreground">{t("guide.choice.sub")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("guide.choice.sub.body")}</p>
        </button>
      </div>

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
                    <p className="text-xs text-red-500">{String(errors.name)}</p>
                  )}
                </div>

                <CategoryPicker
                  tree={parentTree}
                  value={formData.parent_id}
                  mode="any"
                  label={t("Parent category")}
                  placeholder={t("No parent (top-level)")}
                  allowClear
                  required={isChildMode}
                  error={errors.parent_id ? String(errors.parent_id) : null}
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, status: Boolean(v) })
                    }
                  />
                  <Label htmlFor="status">{t("Active")}</Label>
                </div>

                {(globalAttributes.length > 0 || allAttributes.length > 0) && (
                  <div className="space-y-4">
                    {globalAttributes.length > 0 ? (
                      <div className="space-y-2">
                        <Label>{t("attr.type.global")}</Label>
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

                    {allAttributes.length > 0 ? (
                      <div className="space-y-2">
                        <Label>{t("attr.type.specific")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("attr.category.specific_hint")}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {allAttributes.map((attr) => (
                            <label
                              key={attr.id}
                              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                            >
                              <Checkbox
                                checked={formData.attribute_ids.includes(attr.id)}
                                onCheckedChange={(v) =>
                                  toggleAttribute(attr.id, Boolean(v))
                                }
                              />
                              {attr.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full space-y-6 lg:w-80">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Image")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploadField
                  id="category-image"
                  accept="image/*"
                  previewUrl={imagePreview}
                  fileName={formData.image?.name ?? null}
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
                />
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("Creating...") : t("Create Category")}
                </Button>
                <Link href="/admin/categories" className="block">
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

NewCategoryPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
