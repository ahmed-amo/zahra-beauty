<?php

namespace App\Support;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

/**
 * Modest womenswear stand-in catalog. Illustrations live in public/zahra
 * (no model photos). The first boot hides the previous baby catalog; later
 * boots only refresh these rows so products added in admin stay published.
 */
final class ZahraCatalog
{
    public const SOURCE = 'zahra';

    /**
     * @return list<array{name: string, image: string, children: list<string>}>
     */
    public static function categories(): array
    {
        return [
            ['name' => 'Robes', 'image' => 'zahra/robe-sauge.svg', 'children' => []],
            ['name' => 'Abayas', 'image' => 'zahra/abaya-olive.svg', 'children' => []],
            ['name' => 'Ensembles', 'image' => 'zahra/ensemble-ivoire.svg', 'children' => []],
            ['name' => 'Hijabs', 'image' => 'zahra/hijab-noir.svg', 'children' => []],
            ['name' => 'Manteaux', 'image' => 'zahra/robe-camel.svg', 'children' => []],
            ['name' => 'Accessoires', 'image' => 'zahra/hijab-or.svg', 'children' => []],
        ];
    }

    /**
     * @return list<array{slug: string, category: string, name: string, description: string, price: int, compare_at_price: int|null, stock: int, image: string, hero: int|null}>
     */
    public static function products(): array
    {
        return [
            [
                'slug' => 'robe-drapee-sauge',
                'category' => 'robes',
                'name' => 'Robe drapée Sauge',
                'description' => 'Robe longue modeste, taille drapée et manches amples. Coupe intemporelle pour le quotidien.',
                'price' => 8900,
                'compare_at_price' => 10900,
                'stock' => 18,
                'image' => 'zahra/robe-sauge.svg',
                'hero' => 1,
            ],
            [
                'slug' => 'abaya-noeud-olive',
                'category' => 'abayas',
                'name' => 'Abaya nouée Olive',
                'description' => 'Abaya fluide à nouer, tombé long et matière légère. Une pièce signature de la collection.',
                'price' => 12900,
                'compare_at_price' => null,
                'stock' => 14,
                'image' => 'zahra/abaya-olive.svg',
                'hero' => 2,
            ],
            [
                'slug' => 'robe-plissee-camel',
                'category' => 'robes',
                'name' => 'Robe plissée Camel',
                'description' => 'Robe de saison en camel, ceinture fine et jupe plissée. Élégance discrète.',
                'price' => 9800,
                'compare_at_price' => 11800,
                'stock' => 16,
                'image' => 'zahra/robe-camel.svg',
                'hero' => 3,
            ],
            [
                'slug' => 'robe-longue-sable',
                'category' => 'robes',
                'name' => 'Robe longue Sable',
                'description' => 'Robe chemise longue couleur sable, col montant et manches boutonnées.',
                'price' => 9200,
                'compare_at_price' => null,
                'stock' => 20,
                'image' => 'zahra/robe-sable.svg',
                'hero' => null,
            ],
            [
                'slug' => 'abaya-soiree-noire',
                'category' => 'abayas',
                'name' => 'Abaya soirée Noire',
                'description' => 'Abaya noire à liseré doré, pensée pour les sorties. Coupe couvrante et raffinée.',
                'price' => 14900,
                'compare_at_price' => null,
                'stock' => 10,
                'image' => 'zahra/abaya-noire.svg',
                'hero' => null,
            ],
            [
                'slug' => 'ensemble-modestie-ivoire',
                'category' => 'ensembles',
                'name' => 'Ensemble modestie Ivoire',
                'description' => 'Ensemble deux pièces ivoire : tunique et jupe longue, facile à porter en couche.',
                'price' => 11200,
                'compare_at_price' => null,
                'stock' => 12,
                'image' => 'zahra/ensemble-ivoire.svg',
                'hero' => null,
            ],
            [
                'slug' => 'hijab-satin-noir',
                'category' => 'hijabs',
                'name' => 'Hijab satin Noir',
                'description' => 'Hijab satin noir, tombé souple et fini propre. Se porte seul ou sous un manteau.',
                'price' => 2200,
                'compare_at_price' => 2800,
                'stock' => 40,
                'image' => 'zahra/hijab-noir.svg',
                'hero' => null,
            ],
            [
                'slug' => 'hijab-soie-or',
                'category' => 'accessoires',
                'name' => 'Hijab soie Or',
                'description' => 'Foulard doré léger, l’accent de la maison. À porter avec une robe noire ou ivoire.',
                'price' => 2600,
                'compare_at_price' => null,
                'stock' => 36,
                'image' => 'zahra/hijab-or.svg',
                'hero' => null,
            ],
        ];
    }

    public static function install(): void
    {
        $bootstrapped = Product::query()->where('import_source', self::SOURCE)->exists();

        if (! $bootstrapped) {
            Product::query()->update([
                'status' => false,
                'hero_sort_order' => null,
            ]);
            Category::query()->update(['status' => false]);
            Brand::query()->update(['is_active' => false]);
        }

        $categories = self::upsertCategories();
        self::upsertProducts($categories);
        ShopHomeCache::forget();
    }

    /**
     * @return array<string, Category>
     */
    private static function upsertCategories(): array
    {
        $saved = [];

        foreach (self::categories() as $order => $item) {
            $slug = Str::slug($item['name']);
            $category = Category::query()->firstOrNew(['slug' => $slug]);
            $category->fill([
                'name' => $item['name'],
                'status' => true,
                'sort_order' => $order,
                'parent_id' => null,
                'image' => $item['image'],
                'description' => null,
            ]);
            $category->save();
            $saved[$slug] = $category;
        }

        return $saved;
    }

    /**
     * @param  array<string, Category>  $categories
     */
    private static function upsertProducts(array $categories): void
    {
        foreach (self::products() as $item) {
            $category = $categories[$item['category']] ?? null;
            if (! $category) {
                continue;
            }

            $product = Product::query()->firstOrNew(['slug' => $item['slug']]);
            $image = $item['image'];
            $isNew = ! $product->exists;

            if ($isNew) {
                $product->fill([
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'description' => $item['description'],
                    'brand' => 'Zahra',
                    'price' => $item['price'],
                    'compare_at_price' => $item['compare_at_price'],
                    'sale_enabled' => false,
                    'sale_price' => null,
                    'sale_starts_at' => null,
                    'sale_ends_at' => null,
                    'stock' => $item['stock'],
                    'has_variants' => false,
                    'hero_sort_order' => $item['hero'],
                    'image' => $image,
                    'gallery_urls' => ['/'.$image],
                ]);
            }

            $product->category_id = $category->id;
            $product->import_source = self::SOURCE;
            $product->status = true;
            $product->save();
        }
    }
}
