"use client"

import { useEffect, useMemo, useState } from "react"
import { router, usePage } from "@inertiajs/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sparkles,
  ImageIcon,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
} from "lucide-react"
import AdminLayout from "../Layouts/admin-layout"
import { useI18n } from "@/lib/i18n"
import { formatDA } from "@/lib/currency"
import ImageUploadField from "@/components/Admin/ImageUploadField"

interface HomepageSettings {
  cover_image: string | null
  cover_image_url: string | null
}

interface BrandRow {
  id: number
  name: string
  slug: string
  url: string | null
  image_url: string | null
  logo_url: string | null
  sort_order: number
  is_active: boolean
}

interface HeroProduct {
  id: number
  name: string
  price: number
  stock: number
  status: boolean
  hero_sort_order: number
  category: string | null
  image_url: string | null
  is_on_sale: boolean
}

interface HeroCandidate {
  id: number
  name: string
  category: string | null
  image_url: string | null
  price: number
}

interface Props {
  settings: HomepageSettings
  brands: BrandRow[]
  heroProducts: HeroProduct[]
  heroCandidates: HeroCandidate[]
}

const MAX_HERO = 3

export default function Hero({ settings, brands, heroProducts, heroCandidates }: Props) {
  const { t, locale } = useI18n()
  const { flash, errors } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>().props
  const [flashMessage, setFlashMessage] = useState(flash?.success || "")

  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(settings.cover_image_url)
  const [removeCover, setRemoveCover] = useState(false)
  const [savingCover, setSavingCover] = useState(false)

  // Brands
  const [brandName, setBrandName] = useState("")
  const [brandUrl, setBrandUrl] = useState("")
  const [brandImage, setBrandImage] = useState<File | null>(null)
  const [brandLogo, setBrandLogo] = useState<File | null>(null)
  const [savingBrand, setSavingBrand] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editActive, setEditActive] = useState(true)
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editLogo, setEditLogo] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // Hero products
  const [heroDraft, setHeroDraft] = useState<HeroProduct[]>(heroProducts)
  const [pickId, setPickId] = useState("")
  const [savingHero, setSavingHero] = useState(false)

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(settings.cover_image_url)
    }
    setRemoveCover(false)
  }, [settings])

  useEffect(() => {
    setHeroDraft(heroProducts)
  }, [heroProducts])

  useEffect(() => {
    if (flash?.success) setFlashMessage(flash.success)
  }, [flash?.success])

  useEffect(() => {
    if (!flashMessage) return
    const timer = setTimeout(() => setFlashMessage(""), 4000)
    return () => clearTimeout(timer)
  }, [flashMessage])

  const availableCandidates = useMemo(() => {
    const used = new Set(heroDraft.map((h) => h.id))
    return heroCandidates.filter((c) => !used.has(c.id))
  }, [heroCandidates, heroDraft])

  const onCoverFile = (file: File | null) => {
    setCoverFile(file)
    setRemoveCover(false)
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
    } else {
      setCoverPreview(settings.cover_image_url)
    }
  }

  const saveCover = () => {
    setSavingCover(true)
    const data = new FormData()
    data.append("remove_cover", removeCover ? "1" : "0")
    data.append("_method", "PUT")
    if (coverFile) data.append("cover_image", coverFile)

    router.post(route("admin.hero.cover"), data, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setFlashMessage(t("Cover updated."))
        setCoverFile(null)
      },
      onFinish: () => setSavingCover(false),
    })
  }

  const addBrand = () => {
    if (!brandName.trim() || !brandImage) return
    setSavingBrand(true)
    const data = new FormData()
    data.append("name", brandName.trim())
    data.append("url", brandUrl)
    data.append("sort_order", String(brands.length))
    data.append("is_active", "1")
    data.append("image", brandImage)
    if (brandLogo) data.append("logo", brandLogo)

    router.post(route("admin.hero.brands.store"), data, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setFlashMessage(t("Brand added."))
        setBrandName("")
        setBrandUrl("")
        setBrandImage(null)
        setBrandLogo(null)
      },
      onFinish: () => setSavingBrand(false),
    })
  }

  const startEdit = (brand: BrandRow) => {
    setEditingBrand(brand)
    setEditName(brand.name)
    setEditUrl(brand.url ?? "")
    setEditActive(brand.is_active)
    setEditImage(null)
    setEditLogo(null)
    setRemoveLogo(false)
  }

  const saveEditBrand = () => {
    if (!editingBrand || !editName.trim()) return
    setSavingBrand(true)
    const data = new FormData()
    data.append("name", editName.trim())
    data.append("url", editUrl)
    data.append("sort_order", String(editingBrand.sort_order))
    data.append("is_active", editActive ? "1" : "0")
    data.append("remove_logo", removeLogo ? "1" : "0")
    data.append("_method", "PUT")
    if (editImage) data.append("image", editImage)
    if (editLogo) data.append("logo", editLogo)

    router.post(route("admin.hero.brands.update", editingBrand.id), data, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setFlashMessage(t("Brand updated."))
        setEditingBrand(null)
      },
      onFinish: () => setSavingBrand(false),
    })
  }

  const deleteBrand = (brand: BrandRow) => {
    if (!confirm(t("Delete this brand?"))) return
    router.delete(route("admin.hero.brands.destroy", brand.id), {
      preserveScroll: true,
      onSuccess: () => setFlashMessage(t("Brand deleted.")),
    })
  }

  const addHero = () => {
    if (!pickId || heroDraft.length >= MAX_HERO) return
    const cand = availableCandidates.find((c) => String(c.id) === pickId)
    if (!cand) return
    setHeroDraft((prev) => [
      ...prev,
      {
        id: cand.id,
        name: cand.name,
        price: cand.price,
        stock: 0,
        status: true,
        hero_sort_order: prev.length + 1,
        category: cand.category,
        image_url: cand.image_url,
        is_on_sale: false,
      },
    ])
    setPickId("")
  }

  const removeHero = (id: number) => {
    setHeroDraft((prev) => prev.filter((h) => h.id !== id).map((h, i) => ({ ...h, hero_sort_order: i + 1 })))
  }

  const moveHero = (id: number, dir: -1 | 1) => {
    setHeroDraft((prev) => {
      const idx = prev.findIndex((h) => h.id === id)
      const nextIdx = idx + dir
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]]
      return copy.map((h, i) => ({ ...h, hero_sort_order: i + 1 }))
    })
  }

  const saveHero = () => {
    setSavingHero(true)
    router.put(
      route("admin.hero.sync"),
      { product_ids: heroDraft.map((h) => h.id) },
      {
        preserveScroll: true,
        onSuccess: () => setFlashMessage(t("Hero carousel updated.")),
        onFinish: () => setSavingHero(false),
      },
    )
  }

  return (
    <div className="space-y-10">
      {flashMessage && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
          <AlertDescription className="text-green-800 dark:text-green-300">{flashMessage}</AlertDescription>
        </Alert>
      )}
      {errors && Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>{Object.values(errors)[0]}</AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <Sparkles className="h-8 w-8 text-primary" />
          {t("Hero")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("hero.page.help")}</p>
      </div>

      {/* 1. Cover */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("Cover image")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cover.section.help")}</p>
        </div>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <p className="rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {t("cover.size.hint")}
            </p>
            <ImageUploadField
              id="cover_image"
              accept="image/jpeg,image/png,image/webp"
              size="lg"
              label={t("Upload cover")}
              previewUrl={coverPreview && !removeCover ? coverPreview : null}
              fileName={coverFile?.name ?? null}
              onChange={(files) => onCoverFile(files?.[0] ?? null)}
              onClear={() => {
                if (settings.cover_image_url && !coverFile) {
                  setRemoveCover(true)
                  setCoverFile(null)
                  setCoverPreview(null)
                } else {
                  onCoverFile(null)
                }
              }}
            />
            {settings.cover_image_url && !removeCover && !coverFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRemoveCover(true)
                  setCoverFile(null)
                  setCoverPreview(null)
                }}
              >
                {t("Remove cover")}
              </Button>
            ) : null}
            <Button
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={saveCover}
              disabled={savingCover || (!coverFile && !removeCover)}
            >
              {savingCover ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("Save cover")}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 2. Brands */}
      <section className="space-y-4 border-t border-border pt-10">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("Brands")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("brands.section.help")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("Add brand")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("Name")}</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("Link")} ({t("optional")})</Label>
                <Input value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <ImageUploadField
                  label={t("Lifestyle image")}
                  fileName={brandImage?.name ?? null}
                  onChange={(files) => setBrandImage(files?.[0] ?? null)}
                  onClear={() => setBrandImage(null)}
                />
              </div>
              <div className="space-y-2">
                <ImageUploadField
                  label={`${t("Logo")} (${t("optional")})`}
                  fileName={brandLogo?.name ?? null}
                  onChange={(files) => setBrandLogo(files?.[0] ?? null)}
                  onClear={() => setBrandLogo(null)}
                />
              </div>
            </div>
            <Button
              className="gap-2"
              variant="outline"
              onClick={addBrand}
              disabled={savingBrand || !brandName.trim() || !brandImage}
            >
              {savingBrand ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("Add brand")}
            </Button>
          </CardContent>
        </Card>

        {brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
            <p className="font-medium text-foreground">{t("No brands yet")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {brand.image_url ? (
                    <img src={brand.image_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  {brand.logo_url && (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="absolute bottom-3 left-1/2 h-10 max-w-[70%] -translate-x-1/2 object-contain drop-shadow"
                    />
                  )}
                  {!brand.is_active && (
                    <span className="absolute start-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
                      {t("Inactive")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{brand.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => startEdit(brand)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-red-600"
                      onClick={() => deleteBrand(brand)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editingBrand && (
          <Card className="border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {t("Edit brand")}: {editingBrand.name}
              </CardTitle>
              <Button type="button" size="icon" variant="ghost" onClick={() => setEditingBrand(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Name")}</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Link")}</Label>
                  <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="edit_active"
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <Label htmlFor="edit_active">{t("Active")}</Label>
                </div>
                <div className="space-y-2">
                  <ImageUploadField
                    label={t("Replace lifestyle image")}
                    previewUrl={editImage ? null : editingBrand.image_url}
                    fileName={editImage?.name ?? null}
                    onChange={(files) => setEditImage(files?.[0] ?? null)}
                    onClear={() => setEditImage(null)}
                  />
                </div>
                <div className="space-y-2">
                  <ImageUploadField
                    label={t("Replace logo")}
                    previewUrl={editLogo ? null : editingBrand.logo_url}
                    fileName={editLogo?.name ?? null}
                    onChange={(files) => setEditLogo(files?.[0] ?? null)}
                    onClear={() => {
                      setEditLogo(null)
                      setRemoveLogo(false)
                    }}
                  />
                  {editingBrand.logo_url && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setRemoveLogo(true)}>
                      {t("Remove logo")}
                    </Button>
                  )}
                </div>
              </div>
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={saveEditBrand} disabled={savingBrand}>
                {savingBrand ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("Save brand")}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 3. Product hero */}
      <section className="space-y-4 border-t border-border pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("Product spotlight")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("hero.section.help")}</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={saveHero} disabled={savingHero}>
            {savingHero ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("Save hero")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("Add product to hero")} ({heroDraft.length}/{MAX_HERO})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-sm font-medium">{t("Select a product...")}</label>
                <select
                  value={pickId}
                  onChange={(e) => setPickId(e.target.value)}
                  disabled={heroDraft.length >= MAX_HERO || availableCandidates.length === 0}
                  className="h-10 w-full rounded-2xl border border-input bg-card px-3 text-sm text-foreground"
                >
                  <option value="">{t("Select a product...")}</option>
                  {availableCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.category ? ` — ${c.category}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={addHero} disabled={!pickId || heroDraft.length >= MAX_HERO}>
                <Plus className="h-4 w-4" />
                {t("Add")}
              </Button>
            </div>

            {heroDraft.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
                <ImageIcon className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
                <p className="font-medium">{t("No hero products yet")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("hero.empty.hint")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {heroDraft.map((h, index) => (
                  <li
                    key={h.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      {h.image_url ? (
                        <img src={h.image_url} alt="" className="h-14 w-14 rounded-xl border object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.category || "—"} · {formatDA(h.price, locale)}
                          {h.is_on_sale ? ` · ${t("SALE")}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" size="icon" variant="outline" className="h-9 w-9" disabled={index === 0} onClick={() => moveHero(h.id, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        disabled={index === heroDraft.length - 1}
                        onClick={() => moveHero(h.id, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 text-red-600"
                        onClick={() => removeHero(h.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">{t("hero.live.note")}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

Hero.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
