"use client"

import { useEffect, useMemo, useState } from "react"
import { router, usePage } from "@inertiajs/react"
import { AlertCircle, Home, Building2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart, type CartItem } from "@/contexts/cartContext"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type AlgeriaWilaya = {
  code: string
  number: number
  name_fr: string
  name_ar: string
  name_en: string
}

export type AlgeriaCommune = {
  name_fr: string
  name_ar: string
  name_en: string
  postal_code: string | null
}

export type CheckoutFormValues = {
  customer_name: string
  customer_phone: string
  wilaya_code: string
  commune_name: string
  delivery_type: "home" | "business"
}

type CheckoutFormProps = {
  wilayas?: AlgeriaWilaya[]
  /** When set, checkout this cart instead of the global cart context. */
  cartOverride?: CartItem[]
  compact?: boolean
  className?: string
  onSuccess?: () => void
}

function pickFieldError(errors: Record<string, unknown>, key: string): string {
  const v = errors[key]
  if (typeof v === "string") return v
  if (Array.isArray(v) && typeof v[0] === "string") return v[0]
  return ""
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

function wilayaLabel(w: AlgeriaWilaya, locale: string): string {
  if (locale === "ar") return w.name_ar || w.name_fr
  if (locale === "en") return w.name_en || w.name_fr
  return w.name_fr
}

function communeLabel(c: AlgeriaCommune, locale: string): string {
  if (locale === "ar") return c.name_ar || c.name_fr
  if (locale === "en") return c.name_en || c.name_fr
  return c.name_fr
}

export default function CheckoutForm({
  wilayas: wilayasProp,
  cartOverride,
  compact = false,
  className,
  onSuccess,
}: CheckoutFormProps) {
  const { t, locale, formatPrice, direction } = useI18n()
  const { cartItems, clearCart } = useCart()
  const page = usePage().props as {
    auth?: { user?: { name?: string; phone?: string } }
  }

  const items = cartOverride ?? cartItems
  const [wilayas, setWilayas] = useState<AlgeriaWilaya[]>(wilayasProp ?? [])
  const [communes, setCommunes] = useState<AlgeriaCommune[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, unknown>>({})
  const [showPromo, setShowPromo] = useState(false)

  const [form, setForm] = useState<CheckoutFormValues>({
    customer_name: page.auth?.user?.name ?? "",
    customer_phone: page.auth?.user?.phone ?? "",
    wilaya_code: "",
    commune_name: "",
    delivery_type: "home",
  })

  useEffect(() => {
    if (wilayasProp && wilayasProp.length > 0) {
      setWilayas(wilayasProp)
      return
    }
    let cancelled = false
    fetch("/algeria/wilayas", { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setWilayas(data.wilayas ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [wilayasProp])

  useEffect(() => {
    if (!form.wilaya_code) {
      setCommunes([])
      return
    }
    let cancelled = false
    setLoadingCommunes(true)
    fetch(`/algeria/wilayas/${form.wilaya_code}/communes`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCommunes(data.communes ?? [])
      })
      .catch(() => {
        if (!cancelled) setCommunes([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCommunes(false)
      })
    return () => {
      cancelled = true
    }
  }, [form.wilaya_code])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const shippingCost = 80
  const total = subtotal + shippingCost

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.customer_name.trim()) errs.customer_name = t("checkout.error.name_required")
    else if (form.customer_name.trim().length < 3) errs.customer_name = t("checkout.error.name_short")
    if (!form.customer_phone.trim()) errs.customer_phone = t("checkout.error.phone_required")
    else if (form.customer_phone.trim().length < 9) errs.customer_phone = t("checkout.error.phone_invalid")
    if (!form.wilaya_code) errs.wilaya_code = t("checkout.error.wilaya_required")
    if (!form.commune_name) errs.commune_name = t("checkout.error.commune_required")
    if (items.length === 0) errs.cart = t("checkout.error.cart_empty")
    return errs
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const clientErrs = validate()
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs)
      return
    }
    setLoading(true)
    setErrors({})
    router.post(
      route("checkout.store"),
      {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        wilaya_code: form.wilaya_code,
        commune_name: form.commune_name,
        delivery_type: form.delivery_type,
        cart_items: items.map((i) => ({
          id: i.id,
          variant_id: i.variant_id ?? null,
          quantity: i.quantity,
          birth_list_item_id: i.birth_list_item_id ?? null,
        })),
      },
      {
        onSuccess: () => {
          if (!cartOverride) clearCart()
          onSuccess?.()
        },
        onError: (err) => {
          setErrors(err as Record<string, unknown>)
          setLoading(false)
        },
        onFinish: () => setLoading(false),
      },
    )
  }

  const inputCls = (field: string) =>
    cn(
      "h-11 rounded-xl border-border bg-card text-foreground caret-foreground placeholder:text-muted-foreground focus:ring-1",
      pickFieldError(errors, field)
        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
        : "focus:border-brand-pink focus:ring-brand-pink",
    )

  const selectCls = (field: string) =>
    cn(
      "h-11 w-full rounded-xl border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1",
      pickFieldError(errors, field)
        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:border-brand-pink focus:ring-brand-pink",
    )

  return (
    <form
      onSubmit={handleSubmit}
      dir={direction}
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6",
        compact && "p-3 sm:p-4",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          {t("checkout.form_title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{t("checkout.form_subtitle")}</p>
      </div>

      {pickFieldError(errors, "cart") || pickFieldError(errors, "checkout") ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {pickFieldError(errors, "cart") || pickFieldError(errors, "checkout")}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800">
            {t("checkout.full_name")}
          </Label>
          <Input
            name="customer_name"
            value={form.customer_name}
            onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
            placeholder={t("checkout.full_name")}
            className={inputCls("customer_name")}
            autoComplete="name"
          />
          <FieldError message={pickFieldError(errors, "customer_name")} />
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800">
            {t("checkout.phone")}
          </Label>
          <Input
            name="customer_phone"
            value={form.customer_phone}
            onChange={(e) => setForm((p) => ({ ...p, customer_phone: e.target.value }))}
            placeholder={t("checkout.phone")}
            className={inputCls("customer_phone")}
            inputMode="tel"
            autoComplete="tel"
          />
          <FieldError message={pickFieldError(errors, "customer_phone")} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800">
            {t("checkout.wilaya")}
          </Label>
          <select
            name="wilaya_code"
            value={form.wilaya_code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                wilaya_code: e.target.value,
                commune_name: "",
              }))
            }
            className={selectCls("wilaya_code")}
          >
            <option value="">{t("checkout.select_wilaya")}</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} — {wilayaLabel(w, locale)}
              </option>
            ))}
          </select>
          <FieldError message={pickFieldError(errors, "wilaya_code")} />
        </div>
        <div>
          <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800">
            {t("checkout.commune")}
          </Label>
          <select
            name="commune_name"
            value={form.commune_name}
            disabled={!form.wilaya_code || loadingCommunes}
            onChange={(e) => setForm((p) => ({ ...p, commune_name: e.target.value }))}
            className={cn(selectCls("commune_name"), (!form.wilaya_code || loadingCommunes) && "opacity-60")}
          >
            <option value="">
              {loadingCommunes ? t("checkout.loading_communes") : t("checkout.select_commune")}
            </option>
            {communes.map((c) => {
              const label = communeLabel(c, locale)
              return (
                <option key={`${c.name_fr}-${c.postal_code ?? ""}`} value={c.name_fr}>
                  {label}
                </option>
              )
            })}
          </select>
          <FieldError message={pickFieldError(errors, "commune_name")} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-800">
          {t("checkout.delivery_place")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "home" as const, icon: Home, label: t("checkout.delivery_home") },
              { value: "business" as const, icon: Building2, label: t("checkout.delivery_desk") },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon
            const active = form.delivery_type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, delivery_type: opt.value }))}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                  active
                    ? "border-primary bg-brand-pink-soft text-primary"
                    : "border-border bg-muted text-foreground hover:border-primary/40",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Promo placeholder — visual parity with COD UIs; not wired yet */}
      <button
        type="button"
        onClick={() => setShowPromo((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Tag className="h-4 w-4" />
        {t("checkout.use_promo")}
      </button>
      {showPromo ? (
        <p className="text-center text-xs text-zinc-500">{t("checkout.promo_soon")}</p>
      ) : null}

      <div className="space-y-1.5 border-t border-gray-100 pt-3 text-sm">
        <div className="flex items-center justify-between text-zinc-600">
          <span>{t("checkout.delivery_price")}</span>
          <span className="font-medium text-zinc-900">{formatPrice(shippingCost)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-600">
          <span>{t("checkout.products_total")}</span>
          <span className="font-medium text-zinc-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold">
          <span className="text-zinc-900">{t("checkout.grand_total")}</span>
          <span className="text-emerald-600">{formatPrice(total)}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || items.length === 0}
        className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white hover:bg-brand-dark"
      >
        {loading ? t("checkout.placing_order") : t("checkout.order_now")}
      </Button>

      <p className="text-center text-xs text-zinc-500">{t("checkout.cash_hint")}</p>

      {/* Future payment methods (Chargily) — keep commented for later
      <div className="hidden">
        payment_method selector (cash / chargily)
      </div>
      */}
    </form>
  )
}
