<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\PublicUploadDisk;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'brand',
        'external_key',
        'import_source',
        'price',
        'compare_at_price',
        'sale_enabled',
        'sale_price',
        'sale_starts_at',
        'sale_ends_at',
        'stock',
        'status',
        'has_variants',
        'hero_sort_order',
        'image',
        'gallery_urls',
    ];

    protected $casts = [
        'price' => 'float',
        'compare_at_price' => 'decimal:2',
        'sale_enabled' => 'boolean',
        'sale_price' => 'decimal:2',
        'sale_starts_at' => 'datetime',
        'sale_ends_at' => 'datetime',
        'stock' => 'integer',
        'status' => 'boolean',
        'has_variants' => 'boolean',
        'hero_sort_order' => 'integer',
        'gallery_urls' => 'array',
    ];

    protected $appends = [
        'is_in_stock',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            $base = Str::slug($product->name);
            $slug = $base;
            $n = 0;
            while (static::where('slug', $slug)->exists()) {
                $n++;
                $slug = $base.'-'.$n;
            }
            $product->slug = $slug;
        });
    }

    /** Eager-load average rating + count for shop listings (avoids N+1). */
    public function scopeWithShopReviewStats(Builder $query): Builder
    {
        return $query->withAvg('reviews', 'rating')->withCount('reviews');
    }

    public function scopeWithAttributeFilters(Builder $query, array $attributeValueIds): Builder
    {
        $ids = array_values(array_unique(array_map('intval', $attributeValueIds)));

        if ($ids === []) {
            return $query;
        }

        // Product must have at least one active variant that includes EVERY selected value.
        foreach ($ids as $valueId) {
            $query->whereHas('variants', function (Builder $variantQuery) use ($valueId) {
                $variantQuery->where('is_active', true)
                    ->whereHas('optionValues', fn (Builder $ov) => $ov->where('attribute_value_id', $valueId));
            });
        }

        return $query;
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function registerMediaCollections(): void
    {
        $disk = (string) config('media-library.disk_name', 'public');

        $this->addMediaCollection('gallery')
            ->useDisk($disk)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    }

    /**
     * Persist public gallery URLs on the product row (R2/S3). Call after add/remove/reorder media.
     *
     * @return $this
     */
    public function syncGalleryUrlsFromMedia(): self
    {
        if (! $this->exists) {
            return $this;
        }

        $urls = $this->getMedia('gallery')
            ->sortBy(fn ($m) => $m->order_column ?? $m->id)
            ->values()
            ->map(fn ($media) => $media->getUrl())
            ->filter(fn ($u) => is_string($u) && $u !== '' && $u !== '/')
            ->values()
            ->all();

        $this->forceFill(['gallery_urls' => $urls])->saveQuietly();

        return $this;
    }

    /**
     * Prefer Spatie gallery media; fall back to legacy `image` column.
     * Paths under public/ (e.g. catpics/, producss/) use asset(); otherwise storage/.
     */
    public function galleryImageUrl(): ?string
    {
        return $this->galleryImageUrls()[0] ?? $this->legacyImageAssetUrl();
    }

    /**
     * Gallery URLs for storefront cards/details (max 5).
     *
     * @return array<int, string>
     */
    public function galleryImageUrls(int $max = 5): array
    {
        $max = max(1, min(10, $max));

        if ($this->relationLoaded('media') || $this->hasMedia('gallery')) {
            $urls = $this->getMedia('gallery')
                ->take($max)
                ->map(fn ($m) => $m->getUrl())
                ->filter(fn ($u) => is_string($u) && $u !== '' && $u !== '/')
                ->values()
                ->all();

            if (! empty($urls)) {
                return $urls;
            }
        }

        if (is_array($this->gallery_urls) && count($this->gallery_urls) > 0) {
            return array_slice(array_values(array_filter($this->gallery_urls, fn ($u) => is_string($u) && $u !== '')), 0, $max);
        }

        $legacy = $this->legacyImageAssetUrl();

        return $legacy ? [$legacy] : [];
    }

    protected function legacyImageAssetUrl(): ?string
    {
        return PublicUploadDisk::url($this->image);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order')->orderBy('id');
    }

    public function activeVariants(): HasMany
    {
        return $this->variants()->where('is_active', true);
    }

    public function defaultVariant(): ?ProductVariant
    {
        if ($this->relationLoaded('variants')) {
            return $this->variants->firstWhere('is_default', true)
                ?? $this->variants->first();
        }

        return $this->variants()->where('is_default', true)->first()
            ?? $this->variants()->first();
    }

    /**
     * Resolve the sellable unit for cart/checkout.
     */
    public function resolveVariant(?int $variantId = null): ?ProductVariant
    {
        if ($variantId) {
            $variant = $this->variants()->whereKey($variantId)->where('is_active', true)->first();
            if ($variant) {
                return $variant;
            }
        }

        if ($this->has_variants) {
            return null;
        }

        return $this->defaultVariant();
    }

    /**
     * Scheduled sale (admin "Sales & Pricing" section) is active for current time.
     */
    public function saleScheduleActive(): bool
    {
        if (! $this->sale_enabled || $this->sale_price === null) {
            return false;
        }

        if ((float) $this->sale_price >= (float) $this->price) {
            return false;
        }

        $now = now();

        if ($this->sale_starts_at && $now->lt($this->sale_starts_at)) {
            return false;
        }

        if ($this->sale_ends_at && $now->gt($this->sale_ends_at)) {
            return false;
        }

        return true;
    }

    /** Legacy: compare_at_price higher than price (storefront pays `price`). */
    public function isOnSale(): bool
    {
        if ($this->compare_at_price === null) {
            return false;
        }

        return (float) $this->compare_at_price > (float) $this->price;
    }

    /**
     * Any effective promotion (scheduled sale OR legacy compare-at sale).
     */
    public function getIsSaleActiveAttribute(): bool
    {
        return $this->saleScheduleActive() || $this->isOnSale();
    }

    /**
     * Amount the customer pays right now.
     */
    public function getActivePriceAttribute(): float
    {
        if ($this->saleScheduleActive()) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    /**
     * Strikethrough / "was" price for storefront when a sale is active.
     */
    public function getOriginalDisplayPriceAttribute(): ?float
    {
        if ($this->saleScheduleActive()) {
            return (float) $this->price;
        }

        if ($this->isOnSale()) {
            return (float) $this->compare_at_price;
        }

        return null;
    }

    /** Alias for APIs / Inertia consistency. */
    public function getIsOnSaleEffectiveAttribute(): bool
    {
        return $this->is_sale_active;
    }

    /** Discount percent for badges (0 if not on sale). */
    public function getSaleDiscountPercentageAttribute(): int
    {
        if ($this->saleScheduleActive()) {
            $base = (float) $this->price;
            if ($base <= 0) {
                return 0;
            }

            return (int) round((($base - (float) $this->sale_price) / $base) * 100);
        }

        if (! $this->isOnSale()) {
            return 0;
        }

        $original = (float) $this->compare_at_price;
        $sale = (float) $this->price;
        if ($original <= 0) {
            return 0;
        }

        return (int) round((($original - $sale) / $original) * 100);
    }

    public function getIsInStockAttribute()
    {
        if ($this->has_variants && $this->relationLoaded('variants')) {
            return $this->variants->where('is_active', true)->sum('stock') > 0;
        }

        return $this->stock > 0;
    }

    /**
     * Attributes available for this product's category (and parent category).
     *
     * @return \Illuminate\Support\Collection<int, Attribute>
     */
    public function availableAttributes()
    {
        $category = $this->category;
        if (! $category) {
            return collect();
        }

        $categoryIds = array_filter([$category->id, $category->parent_id]);

        return Attribute::query()
            ->where('is_active', true)
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds))
            ->with(['values' => fn ($q) => $q->orderBy('sort_order')->orderBy('value')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    private function shopReviewsCount(): int
    {
        if (array_key_exists('reviews_count', $this->attributes)) {
            return (int) $this->reviews_count;
        }

        if ($this->relationLoaded('reviews')) {
            return $this->reviews->count();
        }

        return (int) $this->reviews()->count();
    }

    private function shopRatingAverage(): float
    {
        // Storefront default: show 5★ until real customer reviews exist.
        if (array_key_exists('reviews_avg_rating', $this->attributes)) {
            $raw = $this->attributes['reviews_avg_rating'];
            if ($raw !== null && $raw !== '') {
                return round((float) $raw, 1);
            }

            return 5.0;
        }

        if ($this->relationLoaded('reviews')) {
            if ($this->reviews->isEmpty()) {
                return 5.0;
            }

            return round((float) $this->reviews->avg('rating'), 1);
        }

        $avg = $this->reviews()->avg('rating');

        return $avg !== null ? round((float) $avg, 1) : 5.0;
    }

    /**
     * Payload for shop listing / detail (Inertia + cart).
     *
     * @return array<string, mixed>
     */
    public function toShopFrontArray(): array
    {
        $images = $this->galleryImageUrls(5);
        $variants = $this->relationLoaded('variants')
            ? $this->variants
            : collect();

        $activeVariants = $variants->where('is_active', true)->values();
        $stock = $this->has_variants
            ? (int) $activeVariants->sum('stock')
            : (int) $this->stock;

        $fromPrices = $this->has_variants
            ? $activeVariants->map(fn (ProductVariant $v) => $v->active_price)->filter(fn ($p) => $p > 0)
            : collect([$this->active_price]);

        $price = $fromPrices->isNotEmpty() ? (float) $fromPrices->min() : $this->active_price;

        $attributes = [];
        if ($this->has_variants && $activeVariants->isNotEmpty()) {
            $attributes = $activeVariants
                ->flatMap(fn (ProductVariant $v) => $v->optionValues)
                ->groupBy('attribute_id')
                ->map(function ($rows) {
                    $attribute = $rows->first()?->attribute;
                    if (! $attribute) {
                        return null;
                    }

                    $values = $rows
                        ->map(fn ($row) => $row->attributeValue)
                        ->filter()
                        ->unique('id')
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn (AttributeValue $value) => [
                            'id' => $value->id,
                            'value' => $value->value,
                            'slug' => $value->slug,
                            'hex_color' => $value->hex_color,
                        ])
                        ->all();

                    return [
                        'id' => $attribute->id,
                        'name' => $attribute->name,
                        'slug' => $attribute->slug,
                        'values' => $values,
                    ];
                })
                ->filter()
                ->sortBy('name')
                ->values()
                ->all();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'brand' => $this->brand,
            'price' => $price,
            'list_price' => (float) $this->price,
            'compare_at_price' => $this->compare_at_price !== null ? (float) $this->compare_at_price : null,
            'original_display_price' => $this->has_variants ? null : $this->original_display_price,
            'is_on_sale' => $this->has_variants
                ? $activeVariants->contains(fn (ProductVariant $v) => $v->is_sale_active)
                : $this->is_sale_active,
            'is_on_sale_effective' => $this->has_variants
                ? $activeVariants->contains(fn (ProductVariant $v) => $v->is_sale_active)
                : $this->is_sale_active,
            'discount_percentage' => $this->has_variants
                ? (int) ($activeVariants->map(fn (ProductVariant $v) => $v->sale_discount_percentage)->max() ?? 0)
                : $this->sale_discount_percentage,
            'stock' => $stock,
            'in_stock' => $stock > 0,
            'has_variants' => (bool) $this->has_variants,
            'category' => $this->category ? $this->category->name : null,
            'category_id' => $this->category_id,
            'rating' => $this->shopRatingAverage(),
            'reviews_count' => $this->shopReviewsCount(),
            'image' => $this->image,
            'image_url' => $this->galleryImageUrl(),
            'images' => $images,
            'sale_ends_at' => $this->saleScheduleActive() && $this->sale_ends_at
                ? $this->sale_ends_at->toIso8601String()
                : null,
            'sale_enabled' => (bool) $this->sale_enabled,
            'attributes' => $attributes,
            'variants' => $this->has_variants
                ? $activeVariants->map(fn (ProductVariant $v) => $v->toShopFrontArray())->values()->all()
                : (($default = $this->defaultVariant())
                    ? [$default->toShopFrontArray()]
                    : []),
            'default_variant_id' => $this->defaultVariant()?->id,
        ];
    }

    /**
     * Home hero carousel slide (matches ShopBanner carousel shape).
     *
     * @return array<string, mixed>
     */
    public function toHeroSlideArray(int $visualIndex = 0): array
    {
        $shop = $this->toShopFrontArray();
        $desc = Str::limit(strip_tags((string) ($this->description ?? '')), 200);

        $alignments = ['left', 'right', 'left'];
        $overlays = [
            'from-white/85 to-brand-bg/50',
            'from-brand-pink-soft/80 to-white/50',
            'from-white/80 to-primary/10',
        ];
        $i = $visualIndex % 3;

        $imageUrl = $shop['image_url'];
        if (! $imageUrl) {
            $imageUrl = 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=80';
        }

        $formatDa = static fn (float $n): string => ((int) round($n)).' DA';

        $discountPct = (int) ($shop['discount_percentage'] ?? 0);
        if ($this->is_sale_active && $discountPct > 0) {
            $badge = 'SALE · '.$discountPct.'% OFF';
        } elseif ($this->is_sale_active) {
            $badge = 'ON SALE';
        } elseif ($this->stock <= 10 && $this->stock > 0) {
            $badge = 'LOW STOCK';
        } else {
            $badge = 'FEATURED';
        }

        return [
            'id' => $this->id,
            'title' => $this->name,
            'subtitle' => $this->category?->name ?? 'Zahra',
            'description' => $desc !== '' ? $desc : 'Soft, parent-approved picks — explore this highlight from our boutique.',
            'buttonText' => 'Shop now',
            'secondaryButtonText' => 'All products',
            'buttonLink' => '/product/'.$this->slug,
            'secondaryButtonLink' => '/products',
            'imageSrc' => $imageUrl,
            'mobileImageSrc' => $imageUrl,
            'textColor' => 'text-gray-900',
            'overlayColor' => $overlays[$i],
            'alignment' => $alignments[$i],
            'badge' => $badge,
            'price' => $formatDa((float) $shop['price']),
            'originalPrice' => isset($shop['original_display_price']) && $shop['original_display_price'] !== null
                ? $formatDa((float) $shop['original_display_price'])
                : null,
            'discount' => $discountPct > 0 ? $discountPct : null,
        ];
    }
}
