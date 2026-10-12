import AddToCartButton from "@/components/AddToCartButton";
import { cn } from "@/lib/utils";

type CartProduct = {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  stock?: number;
  in_stock?: boolean;
  variant_id?: number | null;
  variant_label?: string | null;
};

type Props = {
  product: CartProduct;
  quantity?: number;
  disabled?: boolean;
  layout?: "card" | "detail";
  className?: string;
  cartClassName?: string;
  listClassName?: string;
};

export default function ProductBuyRow({
  product,
  quantity = 1,
  disabled = false,
  layout = "card",
  className,
  cartClassName,
}: Props) {
  const isDetail = layout === "detail";

  return (
    <div
      className={cn("flex w-full", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={cn("min-w-0 flex-1", cartClassName)}>
        <AddToCartButton
          product={product}
          quantity={quantity}
          disabled={disabled}
          layout="compact"
          className={cn(
            "h-full min-h-0 w-full rounded-none border-0 shadow-none",
            isDetail ? "h-12 min-h-12 px-3 text-[15px] font-semibold" : "h-11 min-h-11 text-sm",
          )}
        />
      </div>
    </div>
  );
}
