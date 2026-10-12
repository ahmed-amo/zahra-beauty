<?php

namespace App\Support;

use App\Models\AttributeValue;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantAttributeValue;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates / replaces a product's variant matrix and keeps the parent
 * product's denormalized stock / price in sync for listings.
 */
final class ProductVariantSync
{
    /**
     * Ensure a simple product has exactly one default variant mirroring
     * product-level price and stock.
     */
    public function syncDefaultVariant(Product $product): ProductVariant
    {
        return DB::transaction(function () use ($product) {
            $variant = $product->variants()->where('is_default', true)->first();

            $payload = [
                'price' => $product->price,
                'compare_at_price' => $product->compare_at_price,
                'sale_enabled' => (bool) $product->sale_enabled,
                'sale_price' => $product->sale_price,
                'sale_starts_at' => $product->sale_starts_at,
                'sale_ends_at' => $product->sale_ends_at,
                'stock' => (int) $product->stock,
                'is_active' => (bool) $product->status,
                'is_default' => true,
                'option_label' => null,
                'option_hash' => 'default',
                'image' => $product->image,
                'gallery_urls' => $product->gallery_urls,
                'sort_order' => 0,
            ];

            if ($variant) {
                $variant->update($payload);
                $product->variants()
                    ->whereKeyNot($variant->id)
                    ->each(fn (ProductVariant $other) => $other->delete());
            } else {
                $variant = $product->variants()->create($payload);
            }

            $product->forceFill(['has_variants' => false])->saveQuietly();

            return $variant->fresh();
        });
    }

    /**
     * Replace the product's variants with the given matrix.
     *
     * @param  list<array{
     *   attribute_value_ids: list<int>,
     *   barcode?: ?string,
     *   price?: ?float|string,
     *   compare_at_price?: ?float|string,
     *   sale_enabled?: bool,
     *   sale_price?: ?float|string,
     *   sale_starts_at?: ?string,
     *   sale_ends_at?: ?string,
     *   stock?: int,
     *   weight?: ?float|string,
     *   is_active?: bool,
     *   image?: ?string,
     *   sort_order?: int
     * }>  $rows
     */
    public function syncVariantMatrix(Product $product, array $rows): void
    {
        if ($rows === []) {
            throw ValidationException::withMessages([
                'variants' => 'Enable variants requires at least one combination.',
            ]);
        }

        DB::transaction(function () use ($product, $rows): void {
            $seenHashes = [];
            $built = [];

            foreach ($rows as $index => $row) {
                $valueIds = array_values(array_unique(array_map('intval', $row['attribute_value_ids'] ?? [])));

                if ($valueIds === []) {
                    throw ValidationException::withMessages([
                        "variants.{$index}.attribute_value_ids" => 'Each variant must have attribute values.',
                    ]);
                }

                $values = AttributeValue::query()
                    ->with('attribute')
                    ->whereIn('id', $valueIds)
                    ->get();

                if ($values->count() !== count($valueIds)) {
                    throw ValidationException::withMessages([
                        "variants.{$index}.attribute_value_ids" => 'One or more attribute values are invalid.',
                    ]);
                }

                $byAttribute = $values->groupBy('attribute_id');
                if ($byAttribute->count() !== $values->count()) {
                    throw ValidationException::withMessages([
                        "variants.{$index}.attribute_value_ids" => 'A variant cannot have two values for the same attribute.',
                    ]);
                }

                $hash = ProductVariant::hashForValueIds($valueIds);
                if (isset($seenHashes[$hash])) {
                    throw ValidationException::withMessages([
                        "variants.{$index}" => 'Duplicate variant combination.',
                    ]);
                }
                $seenHashes[$hash] = true;

                $label = $values
                    ->sortBy(fn (AttributeValue $v) => $v->attribute?->sort_order ?? 0)
                    ->pluck('value')
                    ->implode(' / ');

                $built[] = [
                    'value_ids' => $valueIds,
                    'values' => $values,
                    'payload' => [
                        'barcode' => $row['barcode'] ?? null,
                        'price' => $this->nullableDecimal($row['price'] ?? null),
                        'compare_at_price' => $this->nullableDecimal($row['compare_at_price'] ?? null),
                        'sale_enabled' => (bool) ($row['sale_enabled'] ?? false),
                        'sale_price' => $this->nullableDecimal($row['sale_price'] ?? null),
                        'sale_starts_at' => $row['sale_starts_at'] ?? null,
                        'sale_ends_at' => $row['sale_ends_at'] ?? null,
                        'stock' => max(0, (int) ($row['stock'] ?? 0)),
                        'weight' => $this->nullableDecimal($row['weight'] ?? null),
                        'is_active' => array_key_exists('is_active', $row) ? (bool) $row['is_active'] : true,
                        'is_default' => false,
                        'option_label' => $label,
                        'option_hash' => $hash,
                        'image' => $row['image'] ?? null,
                        'sort_order' => (int) ($row['sort_order'] ?? $index),
                    ],
                ];
            }

            $product->variants()->each(function (ProductVariant $variant): void {
                $variant->optionValues()->delete();
                $variant->delete();
            });

            foreach ($built as $item) {
                /** @var ProductVariant $variant */
                $variant = $product->variants()->create($item['payload']);

                foreach ($item['values'] as $value) {
                    ProductVariantAttributeValue::query()->create([
                        'product_variant_id' => $variant->id,
                        'attribute_id' => $value->attribute_id,
                        'attribute_value_id' => $value->id,
                    ]);
                }
            }

            $product->forceFill(['has_variants' => true])->saveQuietly();
            $this->refreshProductAggregates($product->fresh(['variants']));
        });
    }

    /**
     * Roll variant stock / from-price up onto the product row for listings.
     */
    public function refreshProductAggregates(Product $product): void
    {
        $variants = $product->relationLoaded('variants')
            ? $product->variants
            : $product->variants()->get();

        $active = $variants->where('is_active', true);

        if ($product->has_variants) {
            $stock = (int) $active->sum('stock');
            $fromPrice = $active
                ->map(fn (ProductVariant $v) => $v->active_price)
                ->filter(fn ($p) => $p > 0)
                ->min();

            $product->forceFill([
                'stock' => $stock,
                'price' => $fromPrice !== null ? $fromPrice : $product->price,
            ])->saveQuietly();

            return;
        }

        $default = $variants->firstWhere('is_default', true) ?? $variants->first();
        if ($default) {
            $product->forceFill([
                'stock' => (int) $default->stock,
                'price' => $default->price ?? $product->price,
            ])->saveQuietly();
        }
    }

    private function nullableDecimal(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }
}
