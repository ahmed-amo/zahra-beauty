"use client"

import type React from "react"
import { router, usePage, Link } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, AlertCircle, Plus, Trash2, Globe2, Tags } from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface CategoryOption {
  id: number
  name: string
}

interface AttributeValue {
  id?: number
  value: string
  hex_color: string | null
  sort_order: number
}

interface AttributeData {
  id: number
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  is_global: boolean
  category_ids: number[]
  values: AttributeValue[]
}

interface ValueRow {
  key: string
  id?: number
  value: string
  hex_color: string
  showColor: boolean
}

interface PageProps {
  attribute: AttributeData
  categoryOptions?: CategoryOption[]
  errors: Record<string, string>
  [key: string]: unknown
}

export default function EditAttributePage() {
  const { t } = useI18n()
  const { attribute, categoryOptions = [], errors } = usePage<PageProps>().props
  const [formData, setFormData] = useState({
    name: "",
    is_active: true,
    is_global: false,
    category_ids: [] as number[],
  })
  const [values, setValues] = useState<ValueRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!attribute) return

    setFormData({
      name: attribute.name || "",
      is_active: attribute.is_active,
      is_global: Boolean(attribute.is_global),
      category_ids: attribute.category_ids ?? [],
    })

    setValues(
      (attribute.values ?? []).length > 0
        ? attribute.values.map((row) => ({
            key: String(row.id ?? crypto.randomUUID()),
            id: row.id,
            value: row.value,
            hex_color: row.hex_color || "",
            showColor: Boolean(row.hex_color),
          }))
        : [
            {
              key: crypto.randomUUID(),
              value: "",
              hex_color: "",
              showColor: false,
            },
          ],
    )
  }, [attribute])

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
  }

  const toggleCategory = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: checked
        ? [...prev.category_ids, id]
        : prev.category_ids.filter((cid) => cid !== id),
    }))
  }

  const updateValue = (key: string, patch: Partial<ValueRow>) => {
    setValues((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const addValue = () => {
    setValues((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        value: "",
        hex_color: "",
        showColor: false,
      },
    ])
  }

  const removeValue = (key: string) => {
    setValues((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    router.put(
      `/admin/attributes/${attribute.id}`,
      {
        name: formData.name,
        is_active: formData.is_active,
        is_global: formData.is_global,
        category_ids: formData.is_global ? [] : formData.category_ids,
        values: values
          .filter((row) => row.value.trim() !== "")
          .map((row, index) => ({
            id: row.id,
            value: row.value.trim(),
            hex_color: row.showColor && row.hex_color ? row.hex_color : null,
            sort_order: index,
          })),
      },
      {
        onFinish: () => setIsSubmitting(false),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/attributes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">{t("Edit Attribute")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("attribute.edit.subtitle")}</p>
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
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("attr.form.type_title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, is_global: true, category_ids: [] })
                    }
                    className={cn(
                      "rounded-2xl border p-4 text-start transition",
                      formData.is_global
                        ? "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/30"
                        : "border-border hover:border-sky-500/40",
                    )}
                  >
                    <Globe2 className="mb-2 h-5 w-5 text-sky-600" />
                    <p className="font-semibold">{t("attr.type.global")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("attr.type.global.help")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_global: false })}
                    className={cn(
                      "rounded-2xl border p-4 text-start transition",
                      !formData.is_global
                        ? "border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/30"
                        : "border-border hover:border-violet-500/40",
                    )}
                  >
                    <Tags className="mb-2 h-5 w-5 text-violet-600" />
                    <p className="font-semibold">{t("attr.type.specific")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("attr.type.specific.help")}
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Attribute Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Name")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("attribute.name.placeholder")}
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked === true })
                    }
                  />
                  <Label htmlFor="is_active">{t("Active")}</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">{t("Values")}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addValue} className="gap-1">
                  <Plus className="h-4 w-4" />
                  {t("Add value")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {values.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div className="space-y-1">
                      <Label>{t("attribute.value.label", { n: index + 1 })}</Label>
                      <Input
                        placeholder={t("attribute.value.placeholder")}
                        value={row.value}
                        onChange={(e) => updateValue(row.key, { value: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <Checkbox
                        id={`color-${row.key}`}
                        checked={row.showColor}
                        onCheckedChange={(checked) =>
                          updateValue(row.key, {
                            showColor: checked === true,
                            hex_color: checked === true ? row.hex_color || "#000000" : "",
                          })
                        }
                      />
                      <Label htmlFor={`color-${row.key}`} className="text-xs">
                        {t("Color")}
                      </Label>
                      {row.showColor && (
                        <Input
                          type="color"
                          className="h-9 w-12 p-1"
                          value={row.hex_color || "#000000"}
                          onChange={(e) => updateValue(row.key, { hex_color: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeValue(row.key)}
                        disabled={values.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.values && <p className="text-xs text-red-500">{errors.values}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="w-80 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Categories")}</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 space-y-2 overflow-y-auto">
                {formData.is_global ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-500/5 px-3 py-3 text-sm text-sky-900 dark:border-sky-900 dark:text-sky-100">
                    {t("attr.form.global.categories_hint")}
                  </div>
                ) : categoryOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("No categories yet.")}</p>
                ) : (
                  categoryOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${option.id}`}
                        checked={formData.category_ids.includes(option.id)}
                        onCheckedChange={(checked) => toggleCategory(option.id, checked === true)}
                      />
                      <Label htmlFor={`cat-${option.id}`} className="font-normal">
                        {option.name}
                      </Label>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">{t("Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("Updating...") : t("Update Attribute")}
                </Button>
                <Link href="/admin/attributes">
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

EditAttributePage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
