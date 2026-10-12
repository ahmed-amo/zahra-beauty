<?php

namespace App\Support;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

/**
 * Modest womenswear mock catalog. Photos live in public/zahra/photos.
 * The first boot hides the previous baby catalog; later boots refresh
 * these rows and unpublish Zahra rows that left the catalog.
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
            ['name' => 'Robes', 'image' => 'zahra/photos/robe-sauge.jpg', 'children' => []],
            ['name' => 'Abayas', 'image' => 'zahra/photos/abaya-olive.jpg', 'children' => []],
            ['name' => 'Ensembles', 'image' => 'zahra/photos/ensemble-beige.jpg', 'children' => []],
            ['name' => 'Hijabs', 'image' => 'zahra/photos/hijab-ivoire.jpg', 'children' => []],
            ['name' => 'Manteaux', 'image' => 'zahra/photos/manteau-camel.jpg', 'children' => []],
            ['name' => 'Accessoires', 'image' => 'zahra/photos/sac-tresse.jpg', 'children' => []],
            ['name' => 'Packs', 'image' => 'zahra/photos/pack-universitaire.jpg', 'children' => []],
        ];
    }

    /**
     * @return list<array{slug: string, category: string, name: string, description: string, price: int, compare_at_price: int|null, stock: int, image: string, gallery: list<string>, hero: int|null}>
     */
    public static function products(): array
    {
        return [
            [
                'slug' => 'robe-drapee-sauge',
                'category' => 'robes',
                'name' => 'Robe drapée Sauge',
                'description' => 'Robe longue sauge, taille drapée et manches amples, portée avec un hijab ivoire. La pièce rue de la collection.',
                'price' => 8900,
                'compare_at_price' => 10900,
                'stock' => 18,
                'image' => 'zahra/photos/robe-sauge.jpg',
                'gallery' => ['zahra/photos/robe-sauge.jpg', 'zahra/photos/sac-tresse.jpg'],
                'hero' => 1,
            ],
            [
                'slug' => 'robe-ruchee-noire',
                'category' => 'robes',
                'name' => 'Robe ruchée Noire',
                'description' => 'Robe noire à taille lacée et tombé fluide, pensée pour le soir. Hijab beige compris dans le look.',
                'price' => 9800,
                'compare_at_price' => 11800,
                'stock' => 14,
                'image' => 'zahra/photos/robe-noire.jpg',
                'gallery' => ['zahra/photos/robe-noire.jpg', 'zahra/photos/hijab-noir.jpg'],
                'hero' => 2,
            ],
            [
                'slug' => 'abaya-nouee-olive',
                'category' => 'abayas',
                'name' => 'Abaya nouée Olive',
                'description' => 'Abaya olive fluide, ouverte sur une robe assortie. Hijab sable, coupe couvrante.',
                'price' => 12900,
                'compare_at_price' => null,
                'stock' => 12,
                'image' => 'zahra/photos/abaya-olive.jpg',
                'gallery' => ['zahra/photos/abaya-olive.jpg'],
                'hero' => 3,
            ],
            [
                'slug' => 'ensemble-beige-campus',
                'category' => 'ensembles',
                'name' => 'Ensemble beige Campus',
                'description' => 'Robe longue beige et hijab assorti. Le haut du pack entrée universitaire.',
                'price' => 11200,
                'compare_at_price' => null,
                'stock' => 16,
                'image' => 'zahra/photos/ensemble-beige.jpg',
                'gallery' => ['zahra/photos/ensemble-beige.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'hijab-mousseline-ivoire',
                'category' => 'hijabs',
                'name' => 'Hijab mousseline Ivoire',
                'description' => 'Mousseline ivoire, tombé léger et fini propre. Se porte avec les robes sauge et beige.',
                'price' => 1800,
                'compare_at_price' => 2400,
                'stock' => 48,
                'image' => 'zahra/photos/hijab-ivoire.jpg',
                'gallery' => ['zahra/photos/hijab-ivoire.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'hijab-satin-noir',
                'category' => 'hijabs',
                'name' => 'Hijab satin Noir',
                'description' => 'Satin noir à reflet doux. Le hijab du pack soirée.',
                'price' => 2200,
                'compare_at_price' => 2800,
                'stock' => 40,
                'image' => 'zahra/photos/hijab-noir.jpg',
                'gallery' => ['zahra/photos/hijab-noir.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'manteau-laine-camel',
                'category' => 'manteaux',
                'name' => 'Manteau laine Camel',
                'description' => 'Manteau long camel, à porter sur une robe modeste et un hijab noir.',
                'price' => 14900,
                'compare_at_price' => null,
                'stock' => 9,
                'image' => 'zahra/photos/manteau-camel.jpg',
                'gallery' => ['zahra/photos/manteau-camel.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'sac-main-tresse',
                'category' => 'accessoires',
                'name' => 'Sac main tressé',
                'description' => 'Petit sac en paille tressée, l’accessoire de la robe sauge.',
                'price' => 3200,
                'compare_at_price' => null,
                'stock' => 22,
                'image' => 'zahra/photos/sac-tresse.jpg',
                'gallery' => ['zahra/photos/sac-tresse.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'sneakers-blanches-campus',
                'category' => 'accessoires',
                'name' => 'Sneakers blanches Campus',
                'description' => 'Baskets basses blanches, semelle propre. Incluses dans le pack entrée universitaire.',
                'price' => 4500,
                'compare_at_price' => 5200,
                'stock' => 30,
                'image' => 'zahra/photos/sneakers-blanches.jpg',
                'gallery' => ['zahra/photos/sneakers-blanches.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'sac-a-dos-cuir',
                'category' => 'accessoires',
                'name' => 'Sac à dos cuir',
                'description' => 'Sac à dos rabat cuir marron et corps écru. La pièce cartable du pack campus.',
                'price' => 6200,
                'compare_at_price' => null,
                'stock' => 15,
                'image' => 'zahra/photos/sac-dos.jpg',
                'gallery' => ['zahra/photos/sac-dos.jpg'],
                'hero' => null,
            ],
            [
                'slug' => 'pack-entree-universitaire',
                'category' => 'packs',
                'name' => 'Pack entrée universitaire',
                'description' => 'Le look rentrée : robe beige et hijab, sneakers blanches et sac à dos cuir. Vendu ensemble, moins cher que les pièces séparées.',
                'price' => 18900,
                'compare_at_price' => 21900,
                'stock' => 8,
                'image' => 'zahra/photos/pack-universitaire.jpg',
                'gallery' => [
                    'zahra/photos/pack-universitaire.jpg',
                    'zahra/photos/ensemble-beige.jpg',
                    'zahra/photos/sneakers-blanches.jpg',
                    'zahra/photos/sac-dos.jpg',
                ],
                'hero' => null,
            ],
            [
                'slug' => 'pack-soiree-noire',
                'category' => 'packs',
                'name' => 'Pack soirée Noire',
                'description' => 'Robe ruchée noire, hijab satin noir et boucles dorées. Un look complet pour les sorties.',
                'price' => 12400,
                'compare_at_price' => 14600,
                'stock' => 10,
                'image' => 'zahra/photos/pack-soiree.jpg',
                'gallery' => [
                    'zahra/photos/pack-soiree.jpg',
                    'zahra/photos/robe-noire.jpg',
                    'zahra/photos/hijab-noir.jpg',
                ],
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
            $gallery = array_map(
                fn (string $path) => '/'.ltrim($path, '/'),
                $item['gallery'] ?? [$item['image']],
            );

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
                'image' => $item['image'],
                'gallery_urls' => $gallery,
                'category_id' => $category->id,
                'import_source' => self::SOURCE,
                'status' => true,
            ]);
            $product->save();
        }

        Product::query()
            ->where('import_source', self::SOURCE)
            ->whereNotIn('slug', array_column(self::products(), 'slug'))
            ->each(function (Product $retired) {
                $retired->status = false;
                $retired->hero_sort_order = null;
                $retired->save();

                if (str_ends_with((string) $retired->image, '.svg') || preg_match('/-\d+$/', $retired->slug)) {
                    $retired->delete();
                }
            });
    }
}
