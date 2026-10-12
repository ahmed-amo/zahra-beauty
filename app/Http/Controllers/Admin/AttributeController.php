<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttributeRequest;
use App\Http\Requests\UpdateAttributeRequest;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariantAttributeValue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function index(): Response
    {
        $attributes = Attribute::query()
            ->withCount('values')
            ->with([
                'values' => fn ($q) => $q->orderBy('sort_order')->orderBy('value'),
                'categories' => fn ($q) => $q
                    ->select('categories.id', 'categories.name')
                    ->orderBy('categories.name'),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $attributeIds = $attributes->getCollection()->pluck('id')->all();

        $productsByAttribute = $this->productsLinkedToAttributes($attributeIds);

        $attributes->getCollection()->transform(fn (Attribute $attribute) => [
            'id' => $attribute->id,
            'name' => $attribute->name,
            'sort_order' => $attribute->sort_order,
            'is_active' => $attribute->is_active,
            'is_global' => (bool) $attribute->is_global,
            'values_count' => $attribute->values_count,
            'values' => $attribute->values
                ->map(fn (AttributeValue $value) => [
                    'id' => $value->id,
                    'value' => $value->value,
                    'hex_color' => $value->hex_color,
                ])
                ->values()
                ->all(),
            'categories' => $attribute->is_global
                ? []
                : $attribute->categories
                    ->map(fn (Category $category) => [
                        'id' => $category->id,
                        'name' => $category->name,
                    ])
                    ->values()
                    ->all(),
            'products' => $productsByAttribute[$attribute->id] ?? [],
            'products_count' => count($productsByAttribute[$attribute->id] ?? []),
        ]);

        return Inertia::render('Dashboard/Admin/AttributesDash', [
            'attributes' => $attributes,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Products that use an attribute on a variant, plus products in
     * categories that have the attribute assigned (so the admin can see
     * what it is wired to even before variants exist).
     *
     * @param  list<int>  $attributeIds
     * @return array<int, list<array{id: int, name: string, slug: string, source: string}>>
     */
    private function productsLinkedToAttributes(array $attributeIds): array
    {
        if ($attributeIds === []) {
            return [];
        }

        $map = array_fill_keys($attributeIds, []);

        $variantLinks = ProductVariantAttributeValue::query()
            ->whereIn('attribute_id', $attributeIds)
            ->with(['variant:id,product_id', 'variant.product:id,name,slug'])
            ->get();

        foreach ($variantLinks as $link) {
            $product = $link->variant?->product;
            if (! $product) {
                continue;
            }

            $map[$link->attribute_id][$product->id] = [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'source' => 'variant',
            ];
        }

        $categoryLinks = DB::table('category_attribute')
            ->whereIn('attribute_id', $attributeIds)
            ->get(['attribute_id', 'category_id']);

        $categoryIdsByAttribute = [];
        foreach ($categoryLinks as $row) {
            $categoryIdsByAttribute[(int) $row->attribute_id][] = (int) $row->category_id;
        }

        $allCategoryIds = collect($categoryIdsByAttribute)->flatten()->unique()->values()->all();

        if ($allCategoryIds !== []) {
            $products = Product::query()
                ->whereIn('category_id', $allCategoryIds)
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'category_id']);

            foreach ($categoryIdsByAttribute as $attributeId => $categoryIds) {
                foreach ($products as $product) {
                    if (! in_array((int) $product->category_id, $categoryIds, true)) {
                        continue;
                    }

                    if (isset($map[$attributeId][$product->id])) {
                        continue;
                    }

                    $map[$attributeId][$product->id] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'source' => 'category',
                    ];
                }
            }
        }

        return collect($map)
            ->map(fn (array $products) => array_values(array_slice($products, 0, 30)))
            ->all();
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Admin/AddAttribute', [
            'categoryOptions' => $this->categoryOptions(),
        ]);
    }

    public function store(StoreAttributeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $attribute = Attribute::create([
                'name' => $validated['name'],
                'slug' => filled($validated['slug'] ?? null)
                    ? $validated['slug']
                    : Attribute::uniqueSlug($validated['name']),
                'sort_order' => $validated['sort_order'] ?? 0,
                'is_active' => $validated['is_active'] ?? true,
                'is_global' => $validated['is_global'] ?? false,
            ]);

            $this->syncValues($attribute, $validated['values'] ?? []);
            $this->syncCategories(
                $attribute,
                ($validated['is_global'] ?? false) ? [] : ($validated['category_ids'] ?? []),
            );
        });

        return redirect()->route('admin.attributes')->with('success', __('Attribute created'));
    }

    public function edit(Attribute $attribute): Response
    {
        $attribute->load(['values', 'categories:id']);

        return Inertia::render('Dashboard/Admin/EditAttribute', [
            'attribute' => [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'sort_order' => $attribute->sort_order,
                'is_active' => $attribute->is_active,
                'is_global' => (bool) $attribute->is_global,
                'category_ids' => $attribute->categories->pluck('id')->all(),
                'values' => $attribute->values
                    ->map(fn (AttributeValue $value) => [
                        'id' => $value->id,
                        'value' => $value->value,
                        'hex_color' => $value->hex_color,
                        'sort_order' => $value->sort_order,
                    ])
                    ->values()
                    ->all(),
            ],
            'categoryOptions' => $this->categoryOptions(),
        ]);
    }

    public function update(UpdateAttributeRequest $request, Attribute $attribute): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $attribute): void {
            $slug = filled($validated['slug'] ?? null)
                ? $validated['slug']
                : $attribute->slug;

            $attribute->update([
                'name' => $validated['name'],
                'slug' => $slug,
                'sort_order' => $validated['sort_order'] ?? $attribute->sort_order,
                'is_active' => $validated['is_active'] ?? true,
                'is_global' => $validated['is_global'] ?? false,
            ]);

            $this->syncValues($attribute, $validated['values'] ?? []);
            $this->syncCategories(
                $attribute,
                ($validated['is_global'] ?? false) ? [] : ($validated['category_ids'] ?? []),
            );
        });

        return redirect()->route('admin.attributes')->with('success', __('Attribute updated'));
    }

    public function destroy(Attribute $attribute): RedirectResponse
    {
        $inUse = ProductVariantAttributeValue::query()
            ->where('attribute_id', $attribute->id)
            ->exists();

        if ($inUse) {
            return back()->with('error', 'This attribute is used by product variants and cannot be deleted.');
        }

        $attribute->delete();

        return back()->with('success', __('Attribute deleted'));
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->ordered()
            ->get(['id', 'name', 'parent_id'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->parent_id
                    ? '— '.$category->name
                    : $category->name,
            ])
            ->all();
    }

    /**
     * @param  list<array{id?: int|null, value: string, hex_color?: string|null, sort_order?: int|null}>  $values
     */
    private function syncValues(Attribute $attribute, array $values): void
    {
        $keptIds = [];

        foreach ($values as $index => $row) {
            $payload = [
                'value' => $row['value'],
                'hex_color' => $row['hex_color'] ?? null,
                'sort_order' => $row['sort_order'] ?? $index,
            ];

            $existingId = isset($row['id']) ? (int) $row['id'] : null;

            if ($existingId) {
                $value = $attribute->values()->whereKey($existingId)->first();

                if ($value) {
                    $value->fill($payload);

                    if ($value->isDirty('value')) {
                        $value->slug = AttributeValue::uniqueSlugForAttribute(
                            $attribute->id,
                            $payload['value'],
                            $value->id,
                        );
                    }

                    $value->save();
                    $keptIds[] = $value->id;

                    continue;
                }
            }

            $created = $attribute->values()->create([
                ...$payload,
                'slug' => AttributeValue::uniqueSlugForAttribute($attribute->id, $payload['value']),
            ]);
            $keptIds[] = $created->id;
        }

        $toDelete = $attribute->values()
            ->when($keptIds !== [], fn ($q) => $q->whereNotIn('id', $keptIds))
            ->when($keptIds === [], fn ($q) => $q)
            ->pluck('id');

        if ($toDelete->isEmpty()) {
            return;
        }

        $inUse = ProductVariantAttributeValue::query()
            ->whereIn('attribute_value_id', $toDelete)
            ->exists();

        if ($inUse) {
            throw ValidationException::withMessages([
                'values' => 'Cannot remove attribute values that are used by product variants.',
            ]);
        }

        $attribute->values()->whereIn('id', $toDelete)->delete();
    }

    /**
     * @param  list<int|string>  $categoryIds
     */
    private function syncCategories(Attribute $attribute, array $categoryIds): void
    {
        $sync = [];

        foreach (array_values($categoryIds) as $index => $categoryId) {
            $sync[(int) $categoryId] = ['sort_order' => $index];
        }

        $attribute->categories()->sync($sync);
    }
}
