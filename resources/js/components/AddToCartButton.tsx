import { useState } from 'react';
import { ShoppingBag, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCart } from '../contexts/cartContext';
import { useI18n } from '@/lib/i18n';

interface Product {
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
}

interface AddToCartButtonProps {
  product: Product;
  /** Passed to cart (default 1). */
  quantity?: number;
  variant?: 'default' | 'icon' | 'outline';
  /** Compact row for product detail: smaller control, same orange style. */
  layout?: 'default' | 'compact';
  className?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  variant = 'default',
  layout = 'default',
  className = '',
  disabled = false,
}: AddToCartButtonProps) {
  const { t } = useI18n();
  const { addToCart, isInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const variantId = product.variant_id ?? null;

  const isUnavailable =
    disabled ||
    product.in_stock === false ||
    (product.stock !== undefined && product.stock <= 0);

  const handleAddToCart = () => {
    if (isUnavailable) return;

    setIsAdding(true);
    addToCart(
      {
        id: product.id,
        variant_id: variantId,
        name: product.name,
        variant_label: product.variant_label ?? null,
        price: product.price,
        image: product.image,
        description: product.description,
        category: product.category,
      },
      quantity,
    );

    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }, 300);
  };

  const inCart = isInCart(product.id, variantId);
  const isCompact = layout === 'compact';

  const compactBtnClass = cn(
    'h-10 min-w-0 gap-1 rounded-none px-2 text-xs font-semibold text-white shadow-none sm:gap-1.5 sm:px-3 sm:text-sm',
    'whitespace-nowrap overflow-hidden has-[>svg]:px-2 sm:has-[>svg]:px-3',
    justAdded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-brand-dark',
  );

  const Label = ({ long, short }: { long: string; short: string }) => (
    <>
      <span className="truncate sm:hidden">{short}</span>
      <span className="hidden truncate sm:inline">{long}</span>
    </>
  );

  const unavailableUI = (
    <Button
      disabled
      className={`w-full cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 ${isCompact ? 'h-10 rounded-xl text-sm' : ''} ${className}`}
    >
      {t('Unavailable')}
    </Button>
  );

  if (variant === 'icon') {
    if (isUnavailable) {
      return (
        <Button
          disabled
          size="icon"
          className={`cursor-not-allowed bg-gray-100 text-gray-400 ${className}`}
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        size="icon"
        className={`${className} ${justAdded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-brand-dark'}`}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : justAdded ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <ShoppingBag className="h-4 w-4" strokeWidth={2} />
        )}
      </Button>
    );
  }

  if (variant === 'outline') {
    if (isUnavailable) {
      return (
        <Button
          disabled
          variant="outline"
          className={`inline-flex cursor-not-allowed items-center gap-2 border-gray-200 text-gray-400 ${className}`}
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={2} />
          {t('Unavailable')}
        </Button>
      );
    }

    return (
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        variant="outline"
        className={`inline-flex items-center gap-2 ${className} ${
          justAdded ? 'border-emerald-500 text-emerald-600' : 'border-primary text-primary hover:bg-brand-pink-soft'
        }`}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Adding...')}
          </>
        ) : justAdded ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {t('Added!')}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            {inCart ? t('Add More') : t('Add to Cart')}
          </>
        )}
      </Button>
    );
  }

  // Default variant
  if (isUnavailable) {
    return <div className={className}>{unavailableUI}</div>;
  }

  if (isCompact) {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={cn(compactBtnClass, 'w-full', className)}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <Label long={t('Adding...')} short={t('Adding...')} />
          </>
        ) : justAdded ? (
          <>
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <Label long={t('Added to Cart!')} short={t('Added!')} />
          </>
        ) : inCart ? (
          <>
            <ShoppingBag className="h-4 w-4 shrink-0" strokeWidth={2} />
            <Label long={t('Add More')} short={t('More')} />
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4 shrink-0" strokeWidth={2} />
            <Label long={t('Add to Cart')} short={t('Cart')} />
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`inline-flex w-full items-center justify-center gap-2 ${
          justAdded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-brand-dark'
        }`}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Adding...')}
          </>
        ) : justAdded ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {t('Added to Cart!')}
          </>
        ) : inCart ? (
          <>
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            {t('Add More')}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            {t('Add to Cart')}
          </>
        )}
      </Button>
    </div>
  );
}
