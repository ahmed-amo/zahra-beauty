<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\HomepageSetting;
use App\Models\Product;
use App\Support\ShopHomeCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $seconds = max(10, (int) config('cache.shop_home_seconds', 120));

        $payload = Cache::remember(ShopHomeCache::KEY, $seconds, function () {
            return $this->buildShopHomePayload();
        });

        return Inertia::render('home', $payload);
    }

    /**
     * Assemble props for the shop home page (cached as one blob for Redis/file/db stores).
     *
     * @return array{products: mixed, categories: mixed, salesProducts: mixed, heroSlides: mixed, cover: mixed, brands: mixed, packs: mixed}
     */
    private function buildShopHomePayload(): array
    {
        $products = Product::with(['category', 'media'])
            ->withShopReviewStats()
            ->where('status', true)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Product $product) => $product->toShopFrontArray())
            ->values();

        $categories = Category::shopFrontTree();

        $cover = HomepageSetting::current()->toShopFrontArray();

        $brands = Brand::query()
            ->active()
            ->ordered()
            ->get()
            ->map(fn (Brand $brand) => $brand->toShopFrontArray())
            ->values();

        $heroSlides = Product::with(['category', 'media'])
            ->withShopReviewStats()
            ->where('status', true)
            ->whereNotNull('hero_sort_order')
            ->orderBy('hero_sort_order')
            ->orderBy('id')
            ->limit(3)
            ->get()
            ->values()
            ->map(fn (Product $product, int $index) => $product->toHeroSlideArray($index));

        return [
            'products' => $products,
            'categories' => $categories,
            'heroSlides' => $heroSlides,
            'cover' => $cover,
            'brands' => $brands,
        ];
    }

    /**
     * Shop catalog: category tabs, 10 products per page when a category is selected.
     */
    public function all_products(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $categorySlug = trim((string) $request->query('category', ''));

        $categories = Category::query()
            ->topLevel()
            ->active()
            ->withCount(['products' => fn ($query) => $query->where('status', true)])
            ->ordered()
            ->get()
            ->map(fn (Category $category) => $category->toShopFrontArray())
            ->values();

        $selectedCategory = null;
        $products = null;

        if ($categorySlug !== '') {
            $selectedCategory = Category::query()
                ->where('slug', $categorySlug)
                ->active()
                ->first();
        }

        if ($selectedCategory || $q !== '') {
            $query = Product::query()
                ->with(['category', 'media'])
                ->withShopReviewStats()
                ->where('status', true)
                ->latest();

            if ($selectedCategory) {
                $query->whereIn('category_id', $selectedCategory->selfAndDescendantIds());
            }

            if ($q !== '') {
                $safe = addcslashes($q, '%_\\');
                $term = '%'.$safe.'%';
                $driver = $query->getConnection()->getDriverName();

                $query->where(function ($sub) use ($term, $driver) {
                    if ($driver === 'pgsql') {
                        $sub->where('name', 'ilike', $term)
                            ->orWhere('description', 'ilike', $term);
                    } else {
                        $sub->where('name', 'like', $term)
                            ->orWhere('description', 'like', $term);
                    }
                });
            }

            $products = $query->paginate(10)->withQueryString();
            $products->getCollection()->transform(fn (Product $product) => $product->toShopFrontArray());
        }

        return Inertia::render('ProductsCatalog', [
            'categories' => $categories,
            'selectedCategory' => $selectedCategory?->toShopFrontArray(),
            'filters' => [
                'q' => $q,
                'category' => $categorySlug,
            ],
            'products' => $products,
        ]);
    }

    public function get_category_products(Category $category)
    {
        // A parent lists everything sold beneath it, not just products
        // pinned directly to the parent itself.
        $products = Product::query()
            ->whereIn('category_id', $category->selfAndDescendantIds())
            ->where('status', true)
            ->with(['category', 'media'])
            ->withShopReviewStats()
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $products->getCollection()->transform(function (Product $product) {
            return $product->toShopFrontArray();
        });

        $children = $category->children()
            ->active()
            ->withCount(['products' => fn ($query) => $query->where('status', true)])
            ->get()
            ->map(fn (Category $child) => $child->toShopFrontArray())
            ->values();

        return Inertia::render('CategoryDetail', [
            'category' => [
                ...$category->toShopFrontArray(),
                'image' => $category->image,
                'breadcrumb' => $category->breadcrumb(),
                'children' => $children,
            ],
            'products' => $products,
        ]);
    }

    public function get_categories()
    {
        return Inertia::render('Categories', [
            'categories' => Category::shopFrontTree(),
        ]);
    }
}
