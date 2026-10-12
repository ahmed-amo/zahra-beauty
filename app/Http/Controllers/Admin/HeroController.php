<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\HomepageSetting;
use App\Models\Product;
use App\Support\PublicUploadDisk;
use App\Support\ShopHomeCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HeroController extends Controller
{
    public function index(): Response
    {
        $settings = HomepageSetting::current();

        $brands = Brand::query()
            ->ordered()
            ->get()
            ->map(fn (Brand $brand) => $brand->toAdminArray())
            ->values();

        $heroProducts = Product::with('category')
            ->whereNotNull('hero_sort_order')
            ->orderBy('hero_sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'stock' => (int) $product->stock,
                'status' => (bool) $product->status,
                'hero_sort_order' => (int) $product->hero_sort_order,
                'category' => $product->category?->name,
                'image_url' => $product->galleryImageUrl(),
                'is_on_sale' => $product->isOnSale() || $product->is_sale_active,
            ])
            ->values();

        $heroCandidates = Product::with('category')
            ->whereNull('hero_sort_order')
            ->where('status', true)
            ->orderBy('name')
            ->limit(100)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category?->name,
                'image_url' => $product->galleryImageUrl(),
                'price' => (float) $product->price,
            ])
            ->values();

        return Inertia::render('Dashboard/Admin/Hero', [
            'settings' => $settings->toAdminArray(),
            'brands' => $brands,
            'heroProducts' => $heroProducts,
            'heroCandidates' => $heroCandidates,
        ]);
    }

    public function updateCover(Request $request): RedirectResponse
    {
        $request->validate([
            'cover_image' => ['nullable', 'image', 'max:10240'],
            'remove_cover' => ['sometimes', 'boolean'],
        ]);

        $settings = HomepageSetting::current();

        if ($request->boolean('remove_cover')) {
            PublicUploadDisk::delete($settings->cover_image);
            $settings->cover_image = null;
        }

        if ($request->hasFile('cover_image')) {
            PublicUploadDisk::delete($settings->cover_image);
            $settings->cover_image = PublicUploadDisk::store('homepage', $request->file('cover_image'));
        }

        $settings->save();
        ShopHomeCache::forget();

        return back()->with('success', __('Cover updated.'));
    }

    public function storeBrand(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['required', 'image', 'max:10240'],
            'logo' => ['nullable', 'image', 'max:5120'],
        ]);

        $brand = new Brand([
            'name' => $validated['name'],
            'slug' => Brand::uniqueSlug($validated['name']),
            'url' => $validated['url'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? Brand::query()->max('sort_order') + 1),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $brand->image = PublicUploadDisk::store('brands', $request->file('image'));

        if ($request->hasFile('logo')) {
            $brand->logo = PublicUploadDisk::store('brands/logos', $request->file('logo'));
        }

        $brand->save();
        ShopHomeCache::forget();

        return back()->with('success', __('Brand added.'));
    }

    public function updateBrand(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:10240'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        if ($brand->name !== $validated['name']) {
            $brand->slug = Brand::uniqueSlug($validated['name'], $brand->id);
        }

        $brand->fill([
            'name' => $validated['name'],
            'url' => $validated['url'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? $brand->sort_order),
            'is_active' => $request->boolean('is_active', $brand->is_active),
        ]);

        if ($request->hasFile('image')) {
            PublicUploadDisk::delete($brand->image);
            $brand->image = PublicUploadDisk::store('brands', $request->file('image'));
        }

        if ($request->boolean('remove_logo')) {
            PublicUploadDisk::delete($brand->logo);
            $brand->logo = null;
        }

        if ($request->hasFile('logo')) {
            PublicUploadDisk::delete($brand->logo);
            $brand->logo = PublicUploadDisk::store('brands/logos', $request->file('logo'));
        }

        $brand->save();
        ShopHomeCache::forget();

        return back()->with('success', __('Brand updated.'));
    }

    public function destroyBrand(Brand $brand): RedirectResponse
    {
        PublicUploadDisk::delete($brand->image);
        PublicUploadDisk::delete($brand->logo);
        $brand->delete();
        ShopHomeCache::forget();

        return back()->with('success', __('Brand deleted.'));
    }

    public function syncHero(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_ids' => ['required', 'array', 'max:3'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ]);

        $ids = array_values($validated['product_ids']);

        DB::transaction(function () use ($ids) {
            Product::query()->whereNotNull('hero_sort_order')->update(['hero_sort_order' => null]);

            foreach ($ids as $index => $id) {
                Product::query()->whereKey($id)->update([
                    'hero_sort_order' => $index + 1,
                    'status' => true,
                ]);
            }
        });

        ShopHomeCache::forget();

        return back()->with('success', __('Hero products updated.'));
    }
}
