<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class Attribute extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sort_order',
        'is_active',
        'is_global',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'is_global' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Attribute $attribute): void {
            if (blank($attribute->slug)) {
                $attribute->slug = static::uniqueSlug($attribute->name);
            }
        });
    }

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class)->orderBy('sort_order')->orderBy('value');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_attribute')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order')
            ->orderBy('categories.name');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeGlobal(Builder $query): Builder
    {
        return $query->where('is_global', true);
    }

    public function scopeSpecific(Builder $query): Builder
    {
        return $query->where('is_global', false);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Active global attributes with values (shared by every category).
     *
     * @return Collection<int, self>
     */
    public static function activeGlobalsWithValues(): Collection
    {
        return static::query()
            ->active()
            ->global()
            ->ordered()
            ->with(['values' => fn ($q) => $q->orderBy('sort_order')->orderBy('value')])
            ->get();
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'attribute';
        $slug = $base;
        $n = 0;

        while (static::query()
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $n++;
            $slug = $base.'-'.$n;
        }

        return $slug;
    }
}
