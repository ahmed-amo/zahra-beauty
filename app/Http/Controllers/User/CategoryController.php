<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Attribute;
use App\Models\Category;
use App\Support\PublicUploadDisk;
use App\Support\ShopHomeCache;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        // Paginate parents only, then attach their sous-catégories, so a
        // family is never split across two pages.
        $parents = Category::query()
            ->topLevel()
            ->withCount(['products', 'children'])
            ->with(['children' => fn ($query) => $query->withCount('products')->ordered()])
            ->ordered()
            ->paginate(50)
            ->withQueryString();

        $parents->getCollection()->transform(fn (Category $category) => [
            ...$this->toAdminArray($category),
            'children_count' => (int) ($category->children_count ?? $category->children->count()),
            'children' => $category->children
                ->map(fn (Category $child) => $this->toAdminArray($child))
                ->values()
                ->all(),
        ]);

        return Inertia::render('Dashboard/Admin/CategoriesDash', [
            'categories' => $parents,
            'expandedParentId' => session('expanded_parent_id'),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function create(\Illuminate\Http\Request $request): Response
    {
        $mode = $request->query('mode') === 'child' ? 'child' : 'parent';
        $defaultParentId = $request->integer('parent_id') ?: null;

        if ($defaultParentId && ! Category::query()->whereKey($defaultParentId)->exists()) {
            $defaultParentId = null;
        }

        return Inertia::render('Dashboard/Admin/AddCategorie', [
            'mode' => $mode,
            'defaultParentId' => $defaultParentId,
            'parentTree' => Category::adminTree(),
            'allAttributes' => $this->allAttributes(),
            'globalAttributes' => $this->globalAttributes(),
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $attributeIds = $validated['attribute_ids'] ?? [];
        unset($validated['attribute_ids']);

        if ($request->hasFile('image')) {
            $validated['image'] = PublicUploadDisk::store('categories', $request->file('image'));
        }

        $category = Category::create($validated);
        $this->syncAttributes($category, $attributeIds);

        ShopHomeCache::forget();

        return redirect()
            ->route('admin.categories')
            ->with('success', __('Category created'))
            ->with('expanded_parent_id', $category->parent_id);
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Dashboard/Admin/EditCategories', [
            'category' => [
                'id' => $category->id,
                'parent_id' => $category->parent_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'status' => $category->status,
                'sort_order' => $category->sort_order,
                'image' => $category->image,
                'image_url' => $category->imageUrl(),
                'has_children' => $category->children()->exists(),
                'attribute_ids' => $category->attributes()->pluck('attributes.id')->all(),
            ],
            'parentTree' => Category::adminTree([$category->id]),
            'allAttributes' => $this->allAttributes(),
            'globalAttributes' => $this->globalAttributes(),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();
        $attributeIds = $validated['attribute_ids'] ?? [];
        unset($validated['attribute_ids']);

        if ($request->hasFile('image')) {
            PublicUploadDisk::delete($category->image);
            $validated['image'] = PublicUploadDisk::store('categories', $request->file('image'));
        }

        $category->update($validated);
        $this->syncAttributes($category, $attributeIds);

        ShopHomeCache::forget();

        return redirect()
            ->route('admin.categories')
            ->with('success', __('Category updated'))
            ->with('expanded_parent_id', $category->parent_id);
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->children()->exists()) {
            return back()->with('error', __('Delete or move its sub-categories first.'));
        }

        if ($category->products()->exists()) {
            return back()->with('error', __('This category still has products assigned to it.'));
        }

        if ($category->image) {
            PublicUploadDisk::delete($category->image);
        }

        $category->delete();

        ShopHomeCache::forget();

        return back()->with('success', __('Category deleted'));
    }

    /**
     * Category-specific attributes only (globals are listed separately).
     *
     * @return list<array{id: int, name: string}>
     */
    private function allAttributes(): array
    {
        return Attribute::query()
            ->active()
            ->specific()
            ->ordered()
            ->get(['id', 'name'])
            ->map(fn (Attribute $attribute) => [
                'id' => $attribute->id,
                'name' => $attribute->name,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function globalAttributes(): array
    {
        return Attribute::query()
            ->active()
            ->global()
            ->ordered()
            ->get(['id', 'name'])
            ->map(fn (Attribute $attribute) => [
                'id' => $attribute->id,
                'name' => $attribute->name,
            ])
            ->all();
    }

    /**
     * @param  list<int|string>  $attributeIds
     */
    private function syncAttributes(Category $category, array $attributeIds): void
    {
        $sync = [];

        foreach (array_values($attributeIds) as $index => $attributeId) {
            $sync[(int) $attributeId] = ['sort_order' => $index];
        }

        $category->attributes()->sync($sync);
    }

    /**
     * @return array<string, mixed>
     */
    private function toAdminArray(Category $category): array
    {
        return [
            'id' => $category->id,
            'parent_id' => $category->parent_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'status' => $category->status,
            'sort_order' => $category->sort_order,
            'image' => $category->image,
            'image_url' => $category->imageUrl(),
            'products_count' => $category->products_count ?? 0,
        ];
    }
}
