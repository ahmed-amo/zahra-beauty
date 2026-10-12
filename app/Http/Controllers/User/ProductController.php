<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Attribute;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Support\ProductVariantSync;
use App\Support\PublicUploadDisk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Product::class);

        $search = trim((string) request('search', ''));

        $products = Product::with('category')
            ->with('media')
            ->withCount(['variants as variants_count'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price !== null ? (float) $product->compare_at_price : null,
                'is_on_sale' => $product->isOnSale(),
                'stock' => (int) $product->stock,
                'has_variants' => (bool) $product->has_variants,
                'variants_count' => (int) $product->variants_count,
                'status' => $this->getStockStatus($product->stock),
                'category' => $product->category ? $product->category->name : null,
                'category_id' => $product->category_id,
                'image_url' => $product->galleryImageUrl(),
                'images' => $product->galleryImageUrls(5),
            ]);

        return Inertia::render('Dashboard/Admin/ProductsDash', [
            'products' => $products,
            'filters' => [
                'search' => $search,
            ],
            'categories' => Category::adminTree(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('Dashboard/Admin/AddProduct', [
            'categories' => Category::adminTree(),
            'attributesByCategory' => $this->attributesByCategory(),
        ]);
    }

    public function store(StoreProductRequest $request, ProductVariantSync $variantSync): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $data = $request->validated();
        $hasVariants = (bool) ($data['has_variants'] ?? false);
        $variantRows = $data['variants'] ?? [];
        $weight = $data['weight'] ?? null;
        unset(
            $data['variants'],
            $data['gallery_images'],
            $data['replace_gallery'],
            $data['weight'],
            $data['meta_title'],
            $data['meta_description'],
        );

        if ($request->hasFile('image')) {
            $data['image'] = PublicUploadDisk::store('products', $request->file('image'));
        }

        $galleryFiles = $request->file('gallery_images', []);

        $product = DB::transaction(function () use ($data, $hasVariants, $variantRows, $galleryFiles, $variantSync, $weight) {
            $data['has_variants'] = $hasVariants;
            $data['status'] = array_key_exists('status', $data) ? (bool) $data['status'] : true;

            if ($hasVariants) {
                $data['stock'] = $data['stock'] ?? 0;
                $data['price'] = $data['price'] ?? 0;
            }

            $product = Product::create($data);

            if (is_array($galleryFiles) && count($galleryFiles) > 0) {
                foreach (array_slice($galleryFiles, 0, 5) as $file) {
                    $product->addMedia($file)->toMediaCollection('gallery');
                }
            }

            $product->syncGalleryUrlsFromMedia();

            if ($hasVariants) {
                $variantSync->syncVariantMatrix($product, $variantRows);
            } else {
                $variant = $variantSync->syncDefaultVariant($product);
                if ($weight !== null && $weight !== '') {
                    $variant->update(['weight' => $weight]);
                }
            }

            return $product;
        });

        return redirect()->route('admin.products')
            ->with('success', __('Product created successfully'))
            ->with('preserveScroll', true);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load([
            'media',
            'variants.optionValues.attribute',
            'variants.optionValues.attributeValue',
        ]);

        return Inertia::render('Dashboard/Admin/EditProduct', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'brand' => $product->brand,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price !== null ? (float) $product->compare_at_price : null,
                'sale_enabled' => (bool) $product->sale_enabled,
                'sale_price' => $product->sale_price !== null ? (float) $product->sale_price : null,
                'sale_starts_at' => $product->sale_starts_at?->format('Y-m-d\TH:i'),
                'sale_ends_at' => $product->sale_ends_at?->format('Y-m-d\TH:i'),
                'stock' => (int) $product->stock,
                'status' => $product->status,
                'has_variants' => (bool) $product->has_variants,
                'category_id' => $product->category_id,
                'image_url' => $product->galleryImageUrl(),
                'gallery_images' => $product->galleryImageUrls(5),
                'hero_sort_order' => $product->hero_sort_order,
                'variants' => $product->variants
                    ->reject(fn ($v) => $v->is_default && ! $product->has_variants)
                    ->when(! $product->has_variants, fn ($c) => $c)
                    ->values()
                    ->map(fn ($variant) => [
                        'id' => $variant->id,
                        'barcode' => $variant->barcode,
                        'price' => $variant->price !== null ? (float) $variant->price : null,
                        'compare_at_price' => $variant->compare_at_price !== null ? (float) $variant->compare_at_price : null,
                        'sale_enabled' => (bool) $variant->sale_enabled,
                        'sale_price' => $variant->sale_price !== null ? (float) $variant->sale_price : null,
                        'stock' => (int) $variant->stock,
                        'weight' => $variant->weight !== null ? (float) $variant->weight : null,
                        'is_active' => (bool) $variant->is_active,
                        'option_label' => $variant->option_label,
                        'image_url' => $variant->imageUrl(),
                        'sort_order' => (int) $variant->sort_order,
                        'attribute_value_ids' => $variant->optionValues->pluck('attribute_value_id')->values()->all(),
                    ])
                    ->all(),
            ],
            'categories' => Category::adminTree(),
            'attributesByCategory' => $this->attributesByCategory(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product, ProductVariantSync $variantSync): RedirectResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();
        $hasVariants = (bool) ($data['has_variants'] ?? false);
        $variantRows = $data['variants'] ?? [];
        $weight = $data['weight'] ?? null;
        unset($data['variants'], $data['weight'], $data['meta_title'], $data['meta_description']);

        if (! ($data['sale_enabled'] ?? false)) {
            $data['sale_price'] = null;
            $data['sale_starts_at'] = null;
            $data['sale_ends_at'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteUploadableProductImage($product->image);
            $data['image'] = PublicUploadDisk::store('products', $request->file('image'));
        }

        $galleryFiles = $request->file('gallery_images', []);
        $replace = (bool) ($data['replace_gallery'] ?? false);
        unset($data['gallery_images'], $data['replace_gallery']);

        DB::transaction(function () use ($product, $data, $hasVariants, $variantRows, $galleryFiles, $replace, $variantSync, $weight) {
            $data['has_variants'] = $hasVariants;

            if ($hasVariants) {
                $data['stock'] = $data['stock'] ?? $product->stock;
                $data['price'] = $data['price'] ?? $product->price;
            }

            $product->update($data);

            if (is_array($galleryFiles) && count($galleryFiles) > 0) {
                if ($replace) {
                    $product->clearMediaCollection('gallery');
                }
                foreach (array_slice($galleryFiles, 0, 5) as $file) {
                    $product->addMedia($file)->toMediaCollection('gallery');
                }
            }

            $product->syncGalleryUrlsFromMedia();

            if ($hasVariants) {
                $variantSync->syncVariantMatrix($product->fresh(), $variantRows);
            } else {
                $variant = $variantSync->syncDefaultVariant($product->fresh());
                if ($weight !== null && $weight !== '') {
                    $variant->update(['weight' => $weight]);
                }
            }
        });

        return redirect()->route('admin.products')
            ->with('success', __('Product updated successfully'))
            ->with('preserveScroll', true);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $this->deleteUploadableProductImage($product->image);

        $product->delete();

        return back()->with('success', __('Product deleted successfully'));
    }

    /**
     * Map of category_id => attributes with values, for the variant builder.
     * Always includes active global attributes, then category-specific ones
     * (own or inherited from ancestors).
     *
     * @return array<int, list<array{id: int, name: string, slug: string, is_global: bool, values: list<array{id: int, value: string, slug: string, hex_color: ?string}>}>>
     */
    private function attributesByCategory(): array
    {
        $serialize = function (Attribute $attribute): array {
            return [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'slug' => $attribute->slug,
                'is_global' => (bool) $attribute->is_global,
                'values' => $attribute->values->map(fn ($value) => [
                    'id' => $value->id,
                    'value' => $value->value,
                    'slug' => $value->slug,
                    'hex_color' => $value->hex_color,
                ])->values()->all(),
            ];
        };

        $globals = Attribute::activeGlobalsWithValues();
        $globalSerialized = $globals->map($serialize)->values()->all();
        $globalIds = $globals->pluck('id')->all();

        $categories = Category::query()
            ->with([
                'attributes' => fn ($q) => $q
                    ->where('attributes.is_active', true)
                    ->where('attributes.is_global', false)
                    ->with(['values' => fn ($vq) => $vq->orderBy('sort_order')->orderBy('value')]),
            ])
            ->get()
            ->keyBy('id');

        $map = [];

        foreach ($categories as $category) {
            $node = $category;
            $specific = collect();

            while ($node !== null) {
                $own = $node->attributes->where('is_active', true)->where('is_global', false)->values();

                if ($own->isNotEmpty()) {
                    $specific = $own;
                    break;
                }

                $node = $node->parent_id ? $categories->get($node->parent_id) : null;
            }

            $specificSerialized = $specific
                ->reject(fn (Attribute $attribute) => in_array($attribute->id, $globalIds, true))
                ->map($serialize)
                ->values()
                ->all();

            $map[$category->id] = array_values(array_merge($globalSerialized, $specificSerialized));
        }

        return $map;
    }

    private function getStockStatus(int $stock): string
    {
        if ($stock === 0) {
            return 'out of stock';
        } elseif ($stock < 20) {
            return 'low stock';
        }

        return 'active';
    }

    /** Only remove uploaded files; skip bundled public/ paths (producss/, catpics/). */
    private function deleteUploadableProductImage(?string $path): void
    {
        PublicUploadDisk::delete($path);
    }

    public function get_product_detail(Product $product)
    {
        $product->load([
            'category',
            'media',
            'variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'variants.optionValues.attribute',
            'variants.optionValues.attributeValue',
            'variants.media',
        ]);

        $product->load([
            'reviews' => fn ($q) => $q->with([
                'user:id,name,picture,avatar',
                'order:id,customer_name',
            ])->latest(),
        ]);
        $product->loadAvg('reviews', 'rating');
        $product->loadCount('reviews');

        $category = $product->category;

        $authUser = auth()->user();
        $userReview = null;
        $canReview = false;
        if ($authUser) {
            $userReview = ProductReview::where('user_id', $authUser->id)
                ->where('product_id', $product->id)
                ->first();
            if (! $userReview) {
                // Eligible right after placing an order (success page / product page).
                $canReview = Order::where('user_id', $authUser->id)
                    ->where('status', '!=', 'cancelled')
                    ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
                    ->exists();
            }
        }

        $reviewsList = $product->reviews->map(fn ($r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'body' => $r->body,
            'created_at' => $r->created_at?->toIso8601String(),
            'user' => [
                'name' => $r->user?->name ?? $r->order?->customer_name ?? __('Customer'),
                'avatar_url' => $r->user?->avatarDisplayUrl(),
            ],
        ])->values()->all();

        $productPayload = array_merge($product->toShopFrontArray(), [
            'reviews_list' => $reviewsList,
            'can_review' => $canReview && ! $userReview,
            'user_review' => $userReview ? [
                'id' => $userReview->id,
                'rating' => $userReview->rating,
                'body' => $userReview->body,
            ] : null,
        ]);

        $now = now();

        $saleProducts = Product::query()
            ->with(['category', 'media', 'variants' => fn ($q) => $q->where('is_active', true)])
            ->withShopReviewStats()
            ->where('status', true)
            ->where('stock', '>', 0)
            ->whereKeyNot($product->id)
            ->where(function ($query) use ($now) {
                $query->whereColumn('compare_at_price', '>', 'price')
                    ->orWhere(function ($scheduled) use ($now) {
                        $scheduled->where('sale_enabled', true)
                            ->whereNotNull('sale_price')
                            ->whereColumn('sale_price', '<', 'price')
                            ->where(function ($starts) use ($now) {
                                $starts->whereNull('sale_starts_at')
                                    ->orWhere('sale_starts_at', '<=', $now);
                            })
                            ->where(function ($ends) use ($now) {
                                $ends->whereNull('sale_ends_at')
                                    ->orWhere('sale_ends_at', '>=', $now);
                            });
                    });
            })
            ->latest('updated_at')
            ->limit(12)
            ->get()
            ->values()
            ->map(function (Product $p) {
                $s = $p->toShopFrontArray();

                return [
                    'id' => $s['id'],
                    'name' => $s['name'],
                    'slug' => $s['slug'],
                    'description' => $s['description'] ?? '',
                    'price' => $s['price'],
                    'originalPrice' => (float) ($s['original_display_price'] ?? $s['list_price'] ?? $s['price']),
                    'discountPercentage' => $s['discount_percentage'],
                    'stock' => $s['stock'],
                    'category' => $s['category'],
                    'category_id' => $s['category_id'],
                    'rating' => $s['rating'],
                    'image_url' => $s['image_url'],
                ];
            });

        return Inertia::render('ProductDetail', [
            'product' => $productPayload,
            'category' => $category ? [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ] : null,
            'saleProducts' => $saleProducts,
        ]);
    }
}
