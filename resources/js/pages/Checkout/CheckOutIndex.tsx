"use client"

import { Package } from "lucide-react"
import { router } from "@inertiajs/react"
import ShopFrontLayout from "@/layouts/shop-layout"
import { Button } from "@/components/ui/button"
import CheckoutForm, { type AlgeriaWilaya } from "@/components/Checkout/CheckoutForm"
import { useCart } from "@/contexts/cartContext"
import { useI18n } from "@/lib/i18n"

interface CheckoutPageProps {
  wilayas?: AlgeriaWilaya[]
}

export default function CheckoutPage({ wilayas = [] }: CheckoutPageProps) {
  // CartProvider lives inside ShopFrontLayout — never call useCart above it.
  return (
    <ShopFrontLayout>
      <CheckoutPageContent wilayas={wilayas} />
    </ShopFrontLayout>
  )
}

function CheckoutPageContent({ wilayas = [] }: CheckoutPageProps) {
  const { t, formatPrice } = useI18n()
  const { cartItems } = useCart()

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const shippingCost = 80
  const total = subtotal + shippingCost

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-pink-soft">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{t("Your cart is empty")}</h2>
          <p className="mb-6 text-gray-500">{t("checkout.empty_hint")}</p>
          <Button
            onClick={() => router.visit("/")}
            className="rounded-full bg-primary px-8 text-white hover:bg-brand-dark"
          >
            {t("Continue Shopping")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CheckoutForm wilayas={wilayas} />
          </div>

          <aside className="lg:col-span-2">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5 lg:sticky lg:top-24">
              <h3 className="text-lg font-bold text-foreground">{t("checkout.order_summary")}</h3>
              <ul className="max-h-72 space-y-3 overflow-y-auto">
                {cartItems.map((item) => (
                  <li
                    key={`${item.id}-${item.variant_id ?? "d"}-${item.birth_list_item_id ?? ""}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{item.name}</p>
                      {item.variant_label ? (
                        <p className="text-xs text-zinc-500">{item.variant_label}</p>
                      ) : null}
                      <p className="text-xs text-zinc-500">× {item.quantity}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-zinc-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>{t("checkout.products_total")}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>{t("checkout.delivery_price")}</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-zinc-900">
                  <span>{t("checkout.grand_total")}</span>
                  <span className="text-emerald-600">{formatPrice(total)}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500">{t("checkout.cash_hint")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
