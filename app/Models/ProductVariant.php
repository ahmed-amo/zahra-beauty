<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\PublicUploadDisk;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductVariant extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = [
        'product_id',
        'barcode',
        'reference',
        'price',
        'compare_at_price',
        'sale_enabled',
        'sale_price',
        'sale_starts_at',
        'sale_ends_at',
        'stock',
        'weight',
        'is_active',
        'is_default',
        'option_label',
        'option_hash',
        'image',
        'gallery_urls',
        'sort_order',
        'import_statut',
        'import_availability',
        'import_alternative',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'sale_enabled' => 'boolean',
        'sale_price' => 'decimal:2',
        'sale_starts_at' => 'datetime',
        'sale_ends_at' => 'datetime',
        'stock' => 'integer',
        'weight' => 'decimal:3',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'gallery_urls' => 'array',
        'sort_order' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function optionValues(): HasMany
    {
        return $this->hasMany(ProductVariantAttributeValue::class);
    }

    public function registerMediaCollections(): void
    {
        $disk = (string) config('media-library.disk_name', 'public');

        $this->addMediaCollection('gallery')
            ->useDisk($disk)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    }

    /**
     * Effective list price for this variant (own price or parent product price).
     */
    public function listPrice(): float
    {
        if ($this->price !== null) {
            return (float) $this->price;
        }

        return (float) ($this->product?->price ?? 0);
    }

    public function saleScheduleActive(): bool
    {
        $saleEnabled = $this->sale_enabled;
        $salePrice = $this->sale_price;
        $starts = $this->sale_starts_at;
        $ends = $this->sale_ends_at;
        $list = $this->listPrice();

        // Inherit sale schedule from the product when the variant has none of its own.
        if (! $saleEnabled && $this->product && $this->price === null && $this->sale_price === null) {
            return $this->product->saleScheduleActive();
        }

        if (! $saleEnabled || $salePrice === null) {
            return false;
        }

        if ((float) $salePrice >= $list) {
            return false;
        }

        $now = now();

        if ($starts && $now->lt($starts)) {
            return false;
        }

        if ($ends && $now->gt($ends)) {
            return false;
        }

        return true;
    }

    public function isOnSale(): bool
    {
        $compare = $this->compare_at_price ?? $this->product?->compare_at_price;

        if ($compare === null) {
            return false;
        }

        return (float) $compare > $this->listPrice();
    }

    public function getIsSaleActiveAttribute(): bool
    {
        return $this->saleScheduleActive() || $this->isOnSale();
    }

    public function getActivePriceAttribute(): float
    {
        if ($this->saleScheduleActive()) {
            if ($this->sale_enabled && $this->sale_price !== null) {
                return (float) $this->sale_price;
            }

            return (float) ($this->product?->sale_price ?? $this->listPrice());
        }

        return $this->listPrice();
    }

    public function getOriginalDisplayPriceAttribute(): ?float
    {
        if ($this->saleScheduleActive()) {
            return $this->listPrice();
        }

        if ($this->isOnSale()) {
            return (float) ($this->compare_at_price ?? $this->product?->compare_at_price);
        }

        return null;
    }

    public function getSaleDiscountPercentageAttribute(): int
    {
        $original = $this->original_display_price;
        $active = $this->active_price;

        if ($original === null || $original <= 0 || $active >= $original) {
            return 0;
        }

        return (int) round((($original - $active) / $original) * 100);
    }

    public function getIsInStockAttribute(): bool
    {
        return $this->is_active && $this->stock > 0;
    }

    public function imageUrl(): ?string
    {
        if ($this->relationLoaded('media') || $this->hasMedia('gallery')) {
            $url = $this->getFirstMediaUrl('gallery');
            if (is_string($url) && $url !== '' && $url !== '/') {
                return $url;
            }
        }

        if (is_array($this->gallery_urls) && count($this->gallery_urls) > 0) {
            $first = $this->gallery_urls[0] ?? null;
            if (is_string($first) && $first !== '') {
                return $first;
            }
        }

        if ($this->image) {
            return PublicUploadDisk::url($this->image);
        }

        return $this->product?->galleryImageUrl();
    }

    /**
     * @return array{attribute_id: int, attribute_slug: string, attribute_name: string, value_id: int, value: string, value_slug: string, hex_color: ?string}
     */
    public function optionsPayload(): array
    {
        return $this->optionValues
            ->loadMissing('attribute', 'attributeValue')
            ->sortBy(fn (ProductVariantAttributeValue $row) => $row->attribute?->sort_order ?? 0)
            ->values()
            ->map(fn (ProductVariantAttributeValue $row) => [
                'attribute_id' => $row->attribute_id,
                'attribute_slug' => $row->attribute?->slug,
                'attribute_name' => $row->attribute?->name,
                'value_id' => $row->attribute_value_id,
                'value' => $row->attributeValue?->value,
                'value_slug' => $row->attributeValue?->slug,
                'hex_color' => $row->attributeValue?->hex_color,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function toShopFrontArray(): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'barcode' => $this->barcode,
            'option_label' => $this->option_label,
            'option_hash' => $this->option_hash,
            'price' => $this->active_price,
            'list_price' => $this->listPrice(),
            'compare_at_price' => $this->compare_at_price !== null
                ? (float) $this->compare_at_price
                : ($this->product?->compare_at_price !== null ? (float) $this->product->compare_at_price : null),
            'original_display_price' => $this->original_display_price,
            'is_on_sale' => $this->is_sale_active,
            'discount_percentage' => $this->sale_discount_percentage,
            'stock' => (int) $this->stock,
            'in_stock' => $this->is_in_stock,
            'is_active' => (bool) $this->is_active,
            'is_default' => (bool) $this->is_default,
            'weight' => $this->weight !== null ? (float) $this->weight : null,
            'image_url' => $this->imageUrl(),
            'options' => $this->optionsPayload(),
            'sale_ends_at' => $this->saleScheduleActive()
                ? ($this->sale_ends_at?->toIso8601String() ?? $this->product?->sale_ends_at?->toIso8601String())
                : null,
        ];
    }

    /**
     * Stable hash for a set of attribute value ids (prevents duplicate combinations).
     *
     * @param  list<int>  $attributeValueIds
     */
    public static function hashForValueIds(array $attributeValueIds): string
    {
        $ids = array_values(array_unique(array_map('intval', $attributeValueIds)));
        sort($ids);

        if ($ids === []) {
            return 'default';
        }

        return hash('sha256', implode('-', $ids));
    }
}
