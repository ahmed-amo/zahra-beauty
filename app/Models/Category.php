<?php

namespace App\Models;

use App\Support\PublicUploadDisk;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Category extends Model
{
    use HasFactory;

    /**
     * Soft ceiling for recursion / cycle guards. Nesting itself is unlimited
     * in the schema; this only protects against pathological trees.
     */
    public const MAX_DEPTH = 32;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'status' => 'boolean',
        'parent_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->ordered();
    }

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, 'category_attribute')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    /**
     * Attributes available for this category:
     * 1) all active global attributes (Color, Size, …)
     * 2) plus category-specific attributes (own, else inherited from ancestors)
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Attribute>
     */
    public function effectiveAttributes()
    {
        $globals = Attribute::activeGlobalsWithValues();

        $node = $this;
        $specific = new \Illuminate\Database\Eloquent\Collection;

        while ($node !== null) {
            $own = $node->relationLoaded('attributes')
                ? $node->attributes->where('is_active', true)->where('is_global', false)->values()
                : $node->attributes()
                    ->where('attributes.is_active', true)
                    ->where('attributes.is_global', false)
                    ->with(['values' => fn ($q) => $q->orderBy('sort_order')->orderBy('value')])
                    ->get();

            if ($own->isNotEmpty()) {
                $specific = $own;
                break;
            }

            if (! $node->parent_id) {
                break;
            }

            $node = $node->relationLoaded('parent')
                ? $node->parent
                : $node->parent()->first();
        }

        $globalIds = $globals->pluck('id')->all();
        $merged = $globals->concat(
            $specific->reject(fn (Attribute $attribute) => in_array($attribute->id, $globalIds, true)),
        );

        return $merged->values();
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    public function scopeTopLevel(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function isTopLevel(): bool
    {
        return $this->parent_id === null;
    }

    public function isLeaf(): bool
    {
        if ($this->relationLoaded('children')) {
            return $this->children->isEmpty();
        }

        return ! $this->children()->exists();
    }

    /**
     * Depth of this node (1 = root).
     */
    public function depth(): int
    {
        $depth = 1;
        $node = $this->relationLoaded('parent') ? $this->parent : $this->parent()->first();

        while ($node !== null && $depth < self::MAX_DEPTH) {
            $depth++;
            $node = $node->relationLoaded('parent')
                ? $node->parent
                : $node->parent()->first();
        }

        return $depth;
    }

    /**
     * Ids of this category and every category beneath it.
     *
     * @return list<int>
     */
    public function selfAndDescendantIds(): array
    {
        $ids = [$this->id];
        $frontier = [$this->id];

        while ($frontier !== []) {
            $frontier = static::query()
                ->whereIn('parent_id', $frontier)
                ->pluck('id')
                ->all();

            $ids = array_merge($ids, $frontier);
        }

        return array_values(array_unique($ids));
    }

    /**
     * Breadcrumb trail from the root down to (and including) this category.
     *
     * @return list<array{id: int, name: string, slug: string}>
     */
    public function breadcrumb(): array
    {
        $trail = [];
        $node = $this;

        while ($node !== null) {
            array_unshift($trail, [
                'id' => $node->id,
                'name' => $node->name,
                'slug' => $node->slug,
            ]);

            $node = $node->relationLoaded('parent')
                ? $node->parent
                : $node->parent()->first();
        }

        return $trail;
    }

    public function imageUrl(): ?string
    {
        return PublicUploadDisk::url($this->image);
    }

    /**
     * @return array{id: int, name: string, slug: string, description: ?string, image: ?string, image_url: ?string, parent_id: ?int, products_count: ?int}
     */
    public function toShopFrontArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image,
            'image_url' => $this->imageUrl(),
            'parent_id' => $this->parent_id,
            'products_count' => $this->products_count ?? null,
        ];
    }

    /**
     * Nest a flat collection into a recursive tree (no N+1).
     *
     * @param  Collection<int, self>  $categories
     * @param  array<int, int>|null  $directCounts  category_id => direct product count
     * @return list<array<string, mixed>>
     */
    public static function nestTree(Collection $categories, ?array $directCounts = null): array
    {
        /** @var array<int|string, list<int>> $childrenOf */
        $childrenOf = [];
        /** @var array<int, array<string, mixed>> $items */
        $items = [];

        foreach ($categories as $category) {
            $direct = $directCounts[$category->id]
                ?? (int) ($category->products_count ?? 0);

            $items[$category->id] = [
                'id' => $category->id,
                'parent_id' => $category->parent_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'status' => (bool) $category->status,
                'sort_order' => (int) $category->sort_order,
                'image' => $category->image,
                'image_url' => $category->imageUrl(),
                'direct_products_count' => $direct,
            ];

            $parentKey = $category->parent_id ?? 0;
            $childrenOf[$parentKey][] = $category->id;
        }

        $build = function (int|string $parentKey) use (&$build, &$items, &$childrenOf): array {
            $branch = [];

            foreach ($childrenOf[$parentKey] ?? [] as $id) {
                $node = $items[$id];
                $node['children'] = $build($id);
                $total = (int) $node['direct_products_count'];

                foreach ($node['children'] as $child) {
                    $total += (int) $child['products_count'];
                }

                $node['products_count'] = $total;
                $node['has_children'] = $node['children'] !== [];
                $node['is_leaf'] = $node['children'] === [];
                $branch[] = $node;
            }

            return $branch;
        };

        return $build(0);
    }

    /**
     * Full admin category tree with rolled-up product counts.
     *
     * @param  list<int>  $excludeIds  omit these nodes and their descendants
     * @return list<array<string, mixed>>
     */
    public static function adminTree(array $excludeIds = []): array
    {
        $exclude = [];

        foreach ($excludeIds as $id) {
            $category = static::query()->find($id);
            if ($category) {
                $exclude = array_merge($exclude, $category->selfAndDescendantIds());
            }
        }

        $exclude = array_values(array_unique($exclude));

        $categories = static::query()
            ->ordered()
            ->when($exclude !== [], fn (Builder $q) => $q->whereNotIn('id', $exclude))
            ->withCount('products')
            ->get();

        return static::nestTree($categories);
    }

    /**
     * Active tree for storefront listings (unlimited nesting).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function shopFrontTree(): Collection
    {
        $categories = static::query()
            ->active()
            ->ordered()
            ->withCount('products')
            ->get();

        return collect(static::nestTree($categories));
    }
}
