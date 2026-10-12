import { FormEvent, useMemo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "../../Layouts/admin-layout";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ProductOption = { id: number; name: string; price: number; image_url: string | null };
type BabyType = { value: string; label: string };
type PackItem = { product_id: number; quantity: number };
type PackDetail = {
  id: number;
  name: string;
  slug: string;
  baby_type: string;
  description: string | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  cover_image_url: string | null;
  items: Array<{ product_id: number; quantity: number }>;
};

type Props = {
  pack: PackDetail | null;
  products: ProductOption[];
  babyTypes: BabyType[];
};

export default function BirthListPackForm({ pack, products, babyTypes }: Props) {
  const { t } = useI18n();
  const isEdit = Boolean(pack);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: pack?.name ?? "",
    baby_type: pack?.baby_type ?? babyTypes[0]?.value ?? "newborn",
    description: pack?.description ?? "",
    sort_order: String(pack?.sort_order ?? 0),
    is_featured: pack?.is_featured ?? false,
    is_published: pack?.is_published ?? true,
    remove_cover: false,
  });
  const [cover, setCover] = useState<File | null>(null);
  const [items, setItems] = useState<PackItem[]>(
    pack?.items?.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) ?? [],
  );
  const [productQuery, setProductQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
  }, [products, productQuery]);

  const addProduct = (productId: number) => {
    setItems((prev) => {
      if (prev.some((i) => i.product_id === productId)) return prev;
      return [...prev, { product_id: productId, quantity: 1 }];
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    const data = new FormData();
    data.append("name", form.name);
    data.append("baby_type", form.baby_type);
    data.append("description", form.description);
    data.append("sort_order", form.sort_order);
    data.append("is_featured", form.is_featured ? "1" : "0");
    data.append("is_published", form.is_published ? "1" : "0");
    if (form.remove_cover) data.append("remove_cover", "1");
    if (cover) data.append("cover_image", cover);
    items.forEach((item, index) => {
      data.append(`items[${index}][product_id]`, String(item.product_id));
      data.append(`items[${index}][quantity]`, String(item.quantity));
    });

    const url = isEdit
      ? route("admin.birth-list-packs.update", pack!.slug)
      : route("admin.birth-list-packs.store");

    router.post(url, data, {
      forceFormData: true,
      onFinish: () => setPending(false),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={route("admin.birth-list-packs.index")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("Packs")}
      </Link>
      <h1 className="text-3xl font-bold">{isEdit ? t("Edit pack") : t("New pack")}</h1>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="space-y-2">
          <Label>{t("Name")}</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("e.g. Pack naissance essentiel")}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("Baby type")}</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {babyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, baby_type: type.value })}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                  form.baby_type === type.value
                    ? "border-primary bg-brand-pink-soft text-brand-dark"
                    : "border-border hover:border-primary/40",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Nouveau-né · Bébé · Bambin")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("Description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl"
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Sort order")}</Label>
            <Input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("Cover photo")}</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.is_featured}
              onCheckedChange={(v) => setForm({ ...form, is_featured: Boolean(v) })}
            />
            {t("Featured")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.is_published}
              onCheckedChange={(v) => setForm({ ...form, is_published: Boolean(v) })}
            />
            {t("Published")}
          </label>
          {pack?.cover_image_url && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.remove_cover}
                onCheckedChange={(v) => setForm({ ...form, remove_cover: Boolean(v) })}
              />
              {t("Remove cover photo")}
            </label>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <h2 className="font-semibold">{t("Products in pack")}</h2>
          <Input
            placeholder={t("Search products…")}
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            className="rounded-xl"
          />
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p.id)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted"
                >
                  <span>{p.name}</span>
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <ul className="space-y-2">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              return (
                <li
                  key={item.product_id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {product?.name ?? `#${item.product_id}`}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    className="h-9 w-20 rounded-xl"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.product_id === item.product_id
                            ? { ...row, quantity: Number(e.target.value) || 1 }
                            : row,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setItems((prev) => prev.filter((row) => row.product_id !== item.product_id))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" disabled={pending} className="w-full rounded-xl">
          {pending ? t("Saving…") : isEdit ? t("Save changes") : t("Create pack")}
        </Button>
      </form>
    </div>
  );
}

BirthListPackForm.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
