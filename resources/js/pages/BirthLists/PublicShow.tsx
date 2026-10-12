import { useMemo } from "react";
import { Link, router } from "@inertiajs/react";
import ShopFrontLayout from "@/layouts/shop-layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cartContext";
import { useI18n } from "@/lib/i18n";
import { formatDA } from "@/lib/currency";
import { cn } from "@/lib/utils";

type ListItem = {
  id: number;
  quantity: number;
  status: string;
  product_unavailable: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  } | null;
};

type ListDetail = {
  id: number;
  name: string;
  baby_first_name: string | null;
  share_token: string;
  items: ListItem[];
};

function isPurchasable(item: ListItem): boolean {
  return Boolean(
    item.product &&
      !item.product_unavailable &&
      item.status !== "gifted",
  );
}

export default function PublicShow({
  list,
  isOwner,
}: {
  list: ListDetail;
  isOwner: boolean;
}) {
  const { t } = useI18n();
  const { addToCart } = useCart();

  const purchasable = useMemo(
    () => list.items.filter(isPurchasable),
    [list.items],
  );

  const addItemToCart = (item: ListItem) => {
    if (!item.product) return;
    addToCart(
      {
        id: item.product.id,
        variant_id: null,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url ?? "",
        birth_list_item_id: item.id,
      },
      item.quantity,
    );
  };

  const buyItem = (item: ListItem) => {
    addItemToCart(item);
    router.visit("/checkout");
  };

  const buyEverything = () => {
    purchasable.forEach(addItemToCart);
    if (purchasable.length > 0) {
      router.visit("/checkout");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {t("Birth list")}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-brand-dark">{list.name}</h1>
      {list.baby_first_name && (
        <p className="mt-1 text-brand-muted">{list.baby_first_name}</p>
      )}
      {isOwner && (
        <Link
          href={route("client.birth-lists.show", list.id)}
          className="mt-2 inline-block text-sm font-semibold text-primary"
        >
          {t("Manage this list")}
        </Link>
      )}

      {purchasable.length > 0 && (
        <div className="mt-6">
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold sm:w-auto sm:px-8"
            onClick={buyEverything}
          >
            {t("Buy everything")}
            <span className="ms-2 text-sm font-medium opacity-90">
              ({purchasable.length})
            </span>
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {list.items.map((item) => {
          const gifted = item.status === "gifted";
          const canBuy = isPurchasable(item);

          return (
            <li
              key={item.id}
              className={cn(
                "rounded-2xl border border-brand-border bg-white p-4",
                gifted && "opacity-70",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {item.product ? (
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold">{t("Product unavailable")}</p>
                  )}
                  <p className="text-sm text-brand-muted">
                    ×{item.quantity}
                    {item.product ? ` · ${formatDA(item.product.price)}` : ""}
                  </p>
                  {item.product_unavailable && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {t("Product unavailable")}
                    </p>
                  )}
                  {gifted && (
                    <p className="mt-1 text-xs font-semibold text-green-700">
                      {t("Gifted")}
                    </p>
                  )}
                </div>
                {canBuy && (
                  <Button
                    type="button"
                    className="h-11 shrink-0 rounded-xl px-6"
                    onClick={() => buyItem(item)}
                  >
                    {t("Buy")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

PublicShow.layout = (page: React.ReactNode) => (
  <ShopFrontLayout>{page}</ShopFrontLayout>
);
