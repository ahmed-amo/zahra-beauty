<?php

namespace App\Support\Beaba;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantAttributeValue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class BeabaCatalogImporter
{
    public const SOURCE = 'beaba-xlsx';

    public const DEFAULT_ACTIVE_STOCK = 10;

    /** @var array<string, AttributeValue> */
    private array $colorValueCache = [];

    /** @var array<string, ProductVariant> */
    private array $variantsByBarcode = [];

    /** @var array<string, Product> */
    private array $productsByExternalKey = [];

    private bool $hasOrderItems = true;

    public function __construct(
        private readonly BeabaWorkbook $workbook = new BeabaWorkbook,
        private readonly BeabaColorNormalizer $colors = new BeabaColorNormalizer,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function dryRun(string $path): array
    {
        return $this->buildPlan($this->workbook->read($path), dryRun: true);
    }

    /**
     * @return array<string, mixed>
     */
    public function import(string $path, bool $replaceMock = false): array
    {
        $rows = $this->workbook->read($path);
        $plan = $this->buildPlan($rows, dryRun: false);

        if ($replaceMock) {
            $plan['mock_removed'] = DB::transaction(fn () => $this->replaceMockCatalog());
        }

        $colorAttribute = $this->ensureColorAttribute();
        $categories = $this->ensureCategories($plan['categories']);
        $this->warmWriteCaches($plan, $colorAttribute);

        $createdProducts = 0;
        $updatedProducts = 0;
        $createdVariants = 0;
        $updatedVariants = 0;

        foreach ($plan['product_groups'] as $group) {
            $category = $categories[$group['category_fr']] ?? null;
            if (! $category) {
                throw new RuntimeException('Missing category for '.$group['category_fr']);
            }

            $result = DB::transaction(
                fn () => $this->upsertProductGroup($group, $category, $colorAttribute)
            );
            $createdProducts += $result['product_created'] ? 1 : 0;
            $updatedProducts += $result['product_created'] ? 0 : 1;
            $createdVariants += $result['variants_created'];
            $updatedVariants += $result['variants_updated'];
        }

        $plan['write'] = [
            'products_created' => $createdProducts,
            'products_updated' => $updatedProducts,
            'variants_created' => $createdVariants,
            'variants_updated' => $updatedVariants,
        ];

        return $plan;
    }

    /**
     * @param  list<BeabaRow>  $rows
     * @return array<string, mixed>
     */
    private function buildPlan(array $rows, bool $dryRun): array
    {
        $duplicateEans = [];
        $seenEans = [];
        $ignored = [];
        $statusBuckets = [
            'STOP' => [],
            'Exclu Retail' => [],
            'Onliners' => [],
            'RUNNING CHANGE' => [],
            'NEW' => [],
            'blank' => [],
            'other' => [],
        ];
        $uncertainColors = [];

        $eligible = [];

        foreach ($rows as $row) {
            $statutKey = trim((string) ($row->statut ?? ''));
            if ($statutKey === '') {
                $statusBuckets['blank'][] = $this->rowSummary($row);
            } elseif (isset($statusBuckets[$statutKey])) {
                $statusBuckets[$statutKey][] = $this->rowSummary($row);
            } else {
                $statusBuckets['other'][] = $this->rowSummary($row) + ['statut' => $statutKey];
            }

            if ($row->ean === '') {
                $ignored[] = $this->rowSummary($row) + ['reason' => 'missing_ean'];

                continue;
            }

            if ($row->reference === '') {
                $ignored[] = $this->rowSummary($row) + ['reason' => 'missing_reference'];

                continue;
            }

            if ($row->designation === '') {
                $ignored[] = $this->rowSummary($row) + ['reason' => 'missing_designation'];

                continue;
            }

            if (isset($seenEans[$row->ean])) {
                $duplicateEans[] = [
                    'ean' => $row->ean,
                    'first' => $seenEans[$row->ean],
                    'duplicate' => $this->rowSummary($row),
                ];
                $ignored[] = $this->rowSummary($row) + ['reason' => 'duplicate_ean'];

                continue;
            }

            $seenEans[$row->ean] = $this->rowSummary($row);

            if ($row->colorConfidence === 'uncertain' && str_contains($row->designation, ' - ')) {
                $uncertainColors[] = $this->rowSummary($row);
            }

            $eligible[] = $row;
        }

        $groups = $this->groupRows($eligible);
        $categories = [];
        foreach ($eligible as $row) {
            $categories[$row->categoryFr] = [
                'fr' => $row->categoryFr,
                'en' => $row->categoryEn,
                'raw' => $row->categoryRaw,
            ];
        }

        $existingByBarcode = collect();
        try {
            $existingByBarcode = ProductVariant::query()
                ->whereIn('barcode', array_keys($seenEans))
                ->pluck('id', 'barcode');
        } catch (\Throwable) {
            // Dry-run / offline: estimates assume create when DB is unavailable.
        }

        $wouldCreate = 0;
        $wouldUpdate = 0;
        foreach ($eligible as $row) {
            if ($existingByBarcode->has($row->ean)) {
                $wouldUpdate++;
            } else {
                $wouldCreate++;
            }
        }

        return [
            'dry_run' => $dryRun,
            'source_rows' => count($rows),
            'eligible_rows' => count($eligible),
            'ignored' => $ignored,
            'ignored_count' => count($ignored),
            'duplicate_eans' => $duplicateEans,
            'uncertain_colors' => $uncertainColors,
            'status_buckets' => [
                'STOP' => count($statusBuckets['STOP']),
                'Exclu Retail' => count($statusBuckets['Exclu Retail']),
                'Onliners' => count($statusBuckets['Onliners']),
                'RUNNING CHANGE' => count($statusBuckets['RUNNING CHANGE']),
                'NEW' => count($statusBuckets['NEW']),
                'blank' => count($statusBuckets['blank']),
                'other' => count($statusBuckets['other']),
            ],
            'status_details' => [
                'STOP' => $statusBuckets['STOP'],
                'Exclu Retail' => $statusBuckets['Exclu Retail'],
                'Onliners' => $statusBuckets['Onliners'],
                'RUNNING CHANGE' => $statusBuckets['RUNNING CHANGE'],
            ],
            'categories' => array_values($categories),
            'product_groups' => $groups,
            'product_group_count' => count($groups),
            'color_variant_groups' => count(array_filter($groups, fn ($g) => $g['has_color_variants'])),
            'variant_create_estimate' => $wouldCreate,
            'variant_update_estimate' => $wouldUpdate,
            'price_note' => 'Prices stored as integer DA (66700 => 66700 DA).',
            'images' => 'image and gallery_urls left empty.',
        ];
    }

    /**
     * @param  list<BeabaRow>  $rows
     * @return list<array<string, mixed>>
     */
    private function groupRows(array $rows): array
    {
        /** @var array<string, list<BeabaRow>> $buckets */
        $buckets = [];

        foreach ($rows as $row) {
            if ($row->color === null) {
                $key = 'solo:'.$row->reference;
                $buckets[$key] = [$row];

                continue;
            }

            $key = $row->parentKey();
            $buckets[$key] ??= [];
            $buckets[$key][] = $row;
        }

        $groups = [];

        foreach ($buckets as $key => $members) {
            $hasColorVariants = count($members) >= 2 && collect($members)->every(fn (BeabaRow $r) => $r->color !== null);

            if (! $hasColorVariants && count($members) === 1 && str_starts_with($key, 'beaba:')) {
                // Single confident color → keep full designation as product name, no matrix.
                $row = $members[0];
                $groups[] = $this->soloGroup($row);

                continue;
            }

            if (! $hasColorVariants) {
                foreach ($members as $row) {
                    $groups[] = $this->soloGroup($row);
                }

                continue;
            }

            $first = $members[0];
            $prices = array_map(fn (BeabaRow $r) => $r->priceDa, $members);
            $activeAny = collect($members)->contains(fn (BeabaRow $r) => ! $r->isInactiveStatus());

            $groups[] = [
                'external_key' => $key,
                'name' => $first->baseName,
                'category_fr' => $first->categoryFr,
                'category_en' => $first->categoryEn,
                'has_color_variants' => true,
                'brand' => 'BEABA',
                'price' => min($prices),
                'status' => $activeAny,
                'variants' => array_map(fn (BeabaRow $r) => $this->variantPayload($r, withColor: true), $members),
            ];
        }

        usort($groups, fn ($a, $b) => [$a['category_fr'], $a['name']] <=> [$b['category_fr'], $b['name']]);

        // Guard against accidental duplicate parent keys in the plan.
        $unique = [];
        foreach ($groups as $group) {
            $key = $group['external_key'];
            if (! isset($unique[$key])) {
                $unique[$key] = $group;

                continue;
            }

            $unique[$key]['variants'] = array_merge($unique[$key]['variants'], $group['variants']);
            $unique[$key]['has_color_variants'] = count($unique[$key]['variants']) > 1
                || $unique[$key]['has_color_variants']
                || $group['has_color_variants'];
            $prices = array_map(fn ($v) => (float) $v['price'], $unique[$key]['variants']);
            $unique[$key]['price'] = min($prices);
            $unique[$key]['status'] = $unique[$key]['status'] || $group['status'];
        }

        return array_values($unique);
    }

    /**
     * @return array<string, mixed>
     */
    private function soloGroup(BeabaRow $row): array
    {
        return [
            'external_key' => 'beaba:ref:'.$row->reference,
            'name' => $row->designation,
            'category_fr' => $row->categoryFr,
            'category_en' => $row->categoryEn,
            'has_color_variants' => false,
            'brand' => 'BEABA',
            'price' => $row->priceDa,
            'status' => ! $row->isInactiveStatus(),
            'variants' => [$this->variantPayload($row, withColor: false)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function variantPayload(BeabaRow $row, bool $withColor): array
    {
        return [
            'row' => $row->rowNumber,
            'ean' => $row->ean,
            'reference' => $row->reference,
            'designation' => $row->designation,
            'color' => $withColor ? $row->color : null,
            'price' => $row->priceDa,
            'is_active' => ! $row->isInactiveStatus(),
            'statut' => $row->statut,
            'availability' => $row->availability,
            'alternative' => $row->alternative,
            'color_confidence' => $row->colorConfidence,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rowSummary(BeabaRow $row): array
    {
        return [
            'row' => $row->rowNumber,
            'ean' => $row->ean,
            'reference' => $row->reference,
            'designation' => $row->designation,
            'statut' => $row->statut,
            'availability' => $row->availability,
            'alternative' => $row->alternative,
            'category' => $row->categoryFr,
            'price' => $row->priceDa,
            'base_name' => $row->baseName,
            'color' => $row->color,
            'color_confidence' => $row->colorConfidence,
        ];
    }

    /**
     * @param  list<array{fr: string, en: ?string, raw: string}>  $categories
     * @return array<string, Category>
     */
    private function ensureCategories(array $categories): array
    {
        $map = [];

        foreach ($categories as $index => $meta) {
            $slug = Str::slug($meta['fr']) ?: ('beaba-'.$index);
            $description = $meta['en']
                ? trim($meta['fr'].' / '.$meta['en'])
                : $meta['fr'];

            $category = Category::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $meta['fr'],
                    'description' => $description,
                    'status' => true,
                    'sort_order' => $index,
                    'parent_id' => null,
                ],
            );

            $map[$meta['fr']] = $category;
        }

        return $map;
    }

    private function ensureColorAttribute(): Attribute
    {
        return Attribute::query()->firstOrCreate(
            ['slug' => 'color'],
            [
                'name' => 'Color',
                'sort_order' => 0,
                'is_active' => true,
                'is_global' => true,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $plan
     */
    private function warmWriteCaches(array $plan, Attribute $colorAttribute): void
    {
        $this->colorValueCache = [];
        foreach (AttributeValue::query()->where('attribute_id', $colorAttribute->id)->get() as $value) {
            $this->colorValueCache[$this->colors->normalizeKey($value->value)] = $value;
        }

        $externalKeys = [];
        $barcodes = [];
        foreach ($plan['product_groups'] as $group) {
            $externalKeys[] = $group['external_key'];
            foreach ($group['variants'] as $variant) {
                $barcodes[] = $variant['ean'];
            }
        }

        $this->productsByExternalKey = Product::query()
            ->whereIn('external_key', $externalKeys)
            ->get()
            ->keyBy('external_key')
            ->all();

        $this->variantsByBarcode = ProductVariant::query()
            ->whereIn('barcode', $barcodes)
            ->get()
            ->keyBy('barcode')
            ->all();

        $this->hasOrderItems = OrderItem::query()->exists();
    }

    /**
     * @param  array<string, mixed>  $group
     * @return array{product_created: bool, variants_created: int, variants_updated: int}
     */
    private function upsertProductGroup(array $group, Category $category, Attribute $colorAttribute): array
    {
        $product = Product::query()->firstOrNew(['external_key' => $group['external_key']]);
        $productCreated = ! $product->exists;

        $product->fill([
            'category_id' => $category->id,
            'name' => $group['name'],
            'description' => null,
            'brand' => 'BEABA',
            'external_key' => $group['external_key'],
            'import_source' => self::SOURCE,
            'price' => $group['price'],
            'compare_at_price' => null,
            'sale_enabled' => false,
            'sale_price' => null,
            'sale_starts_at' => null,
            'sale_ends_at' => null,
            'status' => (bool) $group['status'],
            'has_variants' => (bool) $group['has_color_variants'],
            'image' => null,
            'gallery_urls' => null,
        ]);

        if (! $product->exists) {
            $product->stock = 0;
            if (blank($product->slug)) {
                $product->slug = $this->uniqueProductSlug($group['name']);
            }
        }

        $product->save();
        $this->productsByExternalKey[$group['external_key']] = $product;

        $variantsCreated = 0;
        $variantsUpdated = 0;
        $sort = 0;
        $defaultSet = false;

        foreach ($group['variants'] as $variantData) {
            $variant = ProductVariant::query()->firstOrNew(['barcode' => $variantData['ean']]);
            $isNewVariant = ! $variant->exists;

            if ($variant->exists && (int) $variant->product_id !== (int) $product->id) {
                if ($this->hasOrderItems && OrderItem::query()->where('product_variant_id', $variant->id)->exists()) {
                    throw new RuntimeException(
                        "Variant barcode {$variantData['ean']} is linked to orders under another product; refusing to move."
                    );
                }
                $variant->product_id = $product->id;
            }

            if ($isNewVariant) {
                $variant->product_id = $product->id;
                $variant->barcode = $variantData['ean'];
                $variantsCreated++;
            } else {
                $variantsUpdated++;
            }

            $isActive = (bool) $variantData['is_active'];
            $isDefault = ! $defaultSet && $isActive;
            if ($isDefault) {
                $defaultSet = true;
            }

            $variant->fill([
                'product_id' => $product->id,
                'barcode' => $variantData['ean'],
                'reference' => $variantData['reference'],
                'price' => $variantData['price'],
                'compare_at_price' => null,
                'sale_enabled' => false,
                'sale_price' => null,
                'sale_starts_at' => null,
                'sale_ends_at' => null,
                'stock' => $isActive ? self::DEFAULT_ACTIVE_STOCK : 0,
                'is_active' => $isActive,
                'is_default' => $isDefault,
                'option_label' => $variantData['color'],
                'option_hash' => null,
                'image' => null,
                'gallery_urls' => null,
                'sort_order' => $sort++,
                'import_statut' => $variantData['statut'],
                'import_availability' => $variantData['availability'],
                'import_alternative' => $variantData['alternative'],
            ]);

            if ($group['has_color_variants'] && $variantData['color']) {
                $colorValue = $this->ensureColorValue($colorAttribute, $variantData['color']);
                $variant->option_hash = ProductVariant::hashForValueIds([$colorValue->id]);
                $variant->option_label = $colorValue->value;
                $variant->save();

                ProductVariantAttributeValue::query()->updateOrCreate(
                    [
                        'product_variant_id' => $variant->id,
                        'attribute_id' => $colorAttribute->id,
                    ],
                    [
                        'attribute_value_id' => $colorValue->id,
                    ],
                );
            } else {
                $variant->option_hash = 'default';
                $variant->option_label = null;
                $variant->save();
                ProductVariantAttributeValue::query()
                    ->where('product_variant_id', $variant->id)
                    ->delete();
            }

            $this->variantsByBarcode[$variantData['ean']] = $variant;
        }

        if (! $defaultSet) {
            $first = $product->variants()->orderBy('sort_order')->first();
            if ($first) {
                $first->is_default = true;
                $first->save();
            }
        }

        $this->recalculateProductAggregates($product);

        return [
            'product_created' => $productCreated,
            'variants_created' => $variantsCreated,
            'variants_updated' => $variantsUpdated,
        ];
    }

    private function uniqueProductSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $n = 0;

        while (Product::query()->where('slug', $slug)->exists()) {
            $n++;
            $slug = $base.'-'.$n;
        }

        return $slug;
    }

    private function ensureColorValue(Attribute $attribute, string $color): AttributeValue
    {
        $key = $this->colors->normalizeKey($color);
        if (isset($this->colorValueCache[$key])) {
            return $this->colorValueCache[$key];
        }

        $slug = AttributeValue::uniqueSlugForAttribute($attribute->id, $color);
        $value = AttributeValue::query()->create([
            'attribute_id' => $attribute->id,
            'value' => $color,
            'slug' => $slug,
            'hex_color' => null,
            'sort_order' => count($this->colorValueCache),
        ]);

        return $this->colorValueCache[$key] = $value;
    }

    private function recalculateProductAggregates(Product $product): void
    {
        $product->load('variants');
        $active = $product->variants->where('is_active', true);

        $product->stock = (int) $active->sum('stock');
        $product->status = $active->isNotEmpty();
        $product->has_variants = $product->variants->count() > 1
            || $product->variants->contains(fn (ProductVariant $v) => $v->option_hash && $v->option_hash !== 'default');

        $prices = $active->map(fn (ProductVariant $v) => (float) ($v->price ?? 0))->filter(fn ($p) => $p > 0);
        if ($prices->isNotEmpty()) {
            $product->price = $prices->min();
        }

        $product->save();
    }

    /**
     * @return array{products_deleted: int, categories_deleted: int, skipped_ordered: int}
     */
    private function replaceMockCatalog(): array
    {
        $orderedProductIds = OrderItem::query()
            ->whereNotNull('product_id')
            ->distinct()
            ->pluck('product_id')
            ->all();

        $orderedVariantIds = OrderItem::query()
            ->whereNotNull('product_variant_id')
            ->distinct()
            ->pluck('product_variant_id')
            ->all();

        $mockProducts = Product::query()
            ->where(function ($q) {
                $q->whereNull('import_source')
                    ->orWhere('import_source', '!=', self::SOURCE);
            })
            ->when($orderedProductIds !== [], fn ($q) => $q->whereNotIn('id', $orderedProductIds))
            ->get();

        $skippedOrdered = Product::query()
            ->where(function ($q) {
                $q->whereNull('import_source')
                    ->orWhere('import_source', '!=', self::SOURCE);
            })
            ->when($orderedProductIds !== [], fn ($q) => $q->whereIn('id', $orderedProductIds), fn ($q) => $q->whereRaw('1 = 0'))
            ->count();

        $deleted = 0;

        foreach ($mockProducts as $product) {
            $variantIds = $product->variants()->pluck('id');
            if ($variantIds->intersect($orderedVariantIds)->isNotEmpty()) {
                $skippedOrdered++;

                continue;
            }

            // Clear birth-list links that restrict product deletion.
            DB::table('birth_list_items')->where('product_id', $product->id)->delete();
            DB::table('birth_list_pack_items')->where('product_id', $product->id)->delete();
            DB::table('product_reviews')->where('product_id', $product->id)->delete();

            $product->variants()->each(function (ProductVariant $variant) {
                $variant->optionValues()->delete();
                $variant->delete();
            });
            $product->delete();
            $deleted++;
        }

        $categoriesDeleted = 0;
        $orphanCategories = Category::query()
            ->whereDoesntHave('products')
            ->where(function ($q) {
                $q->whereIn('slug', [
                    'naissance', 'puericulture', 'mode-bebe', 'chambre', 'soins-bain',
                    'alimentation', 'jouets', 'packs-cadeaux',
                ])->orWhere('name', 'like', '%demo%');
            })
            ->get();

        foreach ($orphanCategories as $category) {
            $category->attributes()->detach();
            $category->delete();
            $categoriesDeleted++;
        }

        return [
            'products_deleted' => $deleted,
            'categories_deleted' => $categoriesDeleted,
            'skipped_ordered' => $skippedOrdered,
        ];
    }

    public function writeReport(array $plan, string $path): void
    {
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($path, json_encode($plan, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
