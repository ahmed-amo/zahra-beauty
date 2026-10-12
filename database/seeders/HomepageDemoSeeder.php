<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\HomepageSetting;
use App\Models\Product;
use App\Support\ShopHomeCache;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Fills homepage cover, brands strip, and (dev-only) demo child products.
 * Production never invents mock products — BEABA is the real catalog.
 */
class HomepageDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Baby-brand strips and BEABA hero picks are retired. Zahra owns the storefront.
        Brand::query()
            ->whereIn('slug', ['cybex', 'stokke', 'beaba', 'joie', 'kinderkraft', 'babymoov'])
            ->update(['is_active' => false]);

        ShopHomeCache::forget();
    }

    private function shouldSeedDemoProducts(): bool
    {
        if (app()->environment('production')) {
            return false;
        }

        if (Product::query()->where('import_source', 'beaba-xlsx')->exists()) {
            return false;
        }

        return filter_var((string) env('ALLOW_MOCK_CATALOG_SEED', ! app()->environment('production')), FILTER_VALIDATE_BOOLEAN);
    }

    private function seedCover(): void
    {
        $settings = HomepageSetting::current();
        $source = 'catpics/seed-naissance.webp';

        if (! is_file(public_path($source))) {
            $this->command?->warn('Cover seed skipped — missing public/catpics/seed-naissance.webp');

            return;
        }

        // Keep a public/ path so seeded covers survive container redeploys
        // (storage/app/public is ephemeral unless a Railway volume is mounted).
        if (blank($settings->cover_image) || Str::startsWith((string) $settings->cover_image, 'homepage/seed-')) {
            $settings->cover_image = $source;
            $settings->save();
        }
    }

    private function seedBrands(): void
    {
        $brands = [
            ['name' => 'Cybex', 'image' => 'catpics/seed-puericulture.webp', 'sort' => 0],
            ['name' => 'Stokke', 'image' => 'catpics/seed-chambre.webp', 'sort' => 1],
            ['name' => 'Béaba', 'image' => 'catpics/seed-alimentation.webp', 'sort' => 2],
            ['name' => 'Joie', 'image' => 'catpics/seed-naissance.webp', 'sort' => 3],
            ['name' => 'Kinderkraft', 'image' => 'catpics/seed-jouets.webp', 'sort' => 4],
            ['name' => 'Babymoov', 'image' => 'catpics/seed-soins-bain.webp', 'sort' => 5],
        ];

        foreach ($brands as $row) {
            $slug = Str::slug($row['name']);
            $brand = Brand::query()->firstOrNew(['slug' => $slug]);

            if ($brand->exists && filled($brand->image) && ! Str::startsWith((string) $brand->image, 'brands/')) {
                continue;
            }

            if (! is_file(public_path($row['image']))) {
                continue;
            }

            $brand->fill([
                'name' => $row['name'],
                'slug' => $slug,
                'image' => $row['image'],
                'logo' => null,
                'url' => null,
                'sort_order' => $row['sort'],
                'is_active' => true,
            ])->save();
        }
    }

    private function seedHeroProducts(): void
    {
        if (Product::query()->whereNotNull('hero_sort_order')->exists()) {
            return;
        }

        // Prefer live BEABA products when present; fall back to legacy mock slugs.
        $beabaHeroes = Product::query()
            ->where('import_source', 'beaba-xlsx')
            ->where('status', true)
            ->orderBy('name')
            ->limit(3)
            ->get();

        if ($beabaHeroes->isNotEmpty()) {
            foreach ($beabaHeroes as $index => $product) {
                $product->forceFill(['hero_sort_order' => $index + 1])->save();
            }

            return;
        }

        $heroSlugs = [
            'porte-bebe-ergonomique',
            'coffret-cadeau-douceur',
            'ensemble-maille-nuage',
        ];

        foreach ($heroSlugs as $index => $slug) {
            Product::query()->where('slug', $slug)->update([
                'hero_sort_order' => $index + 1,
                'status' => true,
            ]);
        }
    }

    /**
     * Dev-only: put a few products on subcategories so parent pages roll up stock.
     */
    private function seedExtraChildProducts(): void
    {
        $map = [
            'poussettes' => [
                'slug' => 'poussette-compacte-demo',
                'name' => 'Poussette compacte Démo',
                'price' => 24900,
                'stock' => 6,
                'image' => 'catpics/seed-puericulture.webp',
            ],
            'biberons-tetines' => [
                'slug' => 'biberon-anti-colique-demo',
                'name' => 'Biberon anti-colique Démo',
                'price' => 2200,
                'stock' => 40,
                'image' => 'catpics/seed-alimentation.webp',
            ],
            'lits-berceaux' => [
                'slug' => 'berceau-bois-demo',
                'name' => 'Berceau bois Démo',
                'price' => 18900,
                'stock' => 4,
                'image' => 'catpics/seed-chambre.webp',
            ],
        ];

        foreach ($map as $categorySlug => $item) {
            $category = Category::query()->where('slug', $categorySlug)->first();
            if (! $category) {
                continue;
            }

            $product = Product::query()->firstOrNew(['slug' => $item['slug']]);
            $image = $item['image'];
            unset($item['image']);

            $product->fill([
                ...$item,
                'category_id' => $category->id,
                'description' => $item['name'].' — produit de démonstration pour tester les sous-catégories.',
                'compare_at_price' => null,
                'sale_enabled' => false,
                'status' => true,
            ]);

            if (blank($product->image)) {
                $product->image = $image;
            }

            $product->save();
        }
    }
}
