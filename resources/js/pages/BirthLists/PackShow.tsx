import { FormEvent, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Gift, ShoppingBag } from "lucide-react";
import ShopFrontLayout from "@/layouts/shop-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/cartContext";
import { useI18n } from "@/lib/i18n";
import { formatDA } from "@/lib/currency";

type PackItem = {
  id: number;
  quantity: number;
  product_unavailable: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  } | null;
};

type Pack = {
  id: number;
  name: string;
  slug: string;
  baby_type: string;
  baby_type_label: string;
  age_band?: string;
  description: string | null;
  cover_image_url: string | null;
  items: PackItem[];
};

export default function PackShow({ pack }: { pack: Pack }) {
  const { t } = useI18n();
  const { addToCart } = useCart();
  const page = usePage<{ auth?: { user?: { id: number } | null } }>();
  const user = page.props.auth?.user;
  const [cloneOpen, setCloneOpen] = useState(false);
  const [listName, setListName] = useState(pack.name);
  const [pending, setPending] = useState(false);

  const addAllToCart = () => {
    pack.items.forEach((item) => {
      if (item.product_unavailable || !item.product) return;
      addToCart(
        {
          id: item.product.id,
          variant_id: null,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image_url ?? "",
        },
        item.quantity,
      );
    });
  };

  const clone = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.visit(route("login"));
      return;
    }
    setPending(true);
    router.post(
      route("client.birth-lists.from-pack", pack.slug),
      {
        name: listName,
      },
      { onFinish: () => setPending(false) },
    );
  };

  return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href={route("birth-lists.showcase")} className="text-sm font-medium text-primary">
          ← {t("Birth lists")}
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-brand-pink-soft">
            {pack.cover_image_url ? (
              <img src={pack.cover_image_url} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center">
                <Gift className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              {pack.baby_type_label || pack.age_band}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-brand-dark">{pack.name}</h1>
            {pack.description && <p className="mt-3 text-brand-muted">{pack.description}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" className="rounded-xl" onClick={addAllToCart}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t("Add all to cart")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (!user) {
                    router.visit(route("login"));
                    return;
                  }
                  setCloneOpen(true);
                }}
              >
                <Gift className="mr-2 h-4 w-4" />
                {t("Use as my birth list")}
              </Button>
            </div>
            {cloneOpen && (
              <form onSubmit={clone} className="mt-6 space-y-3 rounded-2xl border border-brand-border p-4">
                <div className="space-y-1">
                  <Label>{t("List name")}</Label>
                  <Input
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-full rounded-xl">
                  {pending ? t("Saving…") : t("Create from pack")}
                </Button>
              </form>
            )}
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold">{t("Included products")}</h2>
        <ul className="mt-4 divide-y divide-brand-border rounded-2xl border border-brand-border bg-white">
          {pack.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-100">
                {item.product?.image_url && (
                  <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.product ? (
                  <Link href={`/product/${item.product.slug}`} className="font-semibold hover:text-primary">
                    {item.product.name}
                  </Link>
                ) : (
                  <span className="font-semibold">{t("Product unavailable")}</span>
                )}
                <p className="text-sm text-brand-muted">
                  ×{item.quantity}
                  {item.product ? ` · ${formatDA(item.product.price)}` : ""}
                </p>
                {item.product_unavailable && (
                  <span className="text-xs font-semibold text-red-600">{t("Product unavailable")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
  );
}

PackShow.layout = (page: React.ReactNode) => <ShopFrontLayout>{page}</ShopFrontLayout>;
