<?php

namespace App\Models;

use App\Support\PublicUploadDisk;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Brand extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'image',
        'url',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Brand $brand): void {
            if (blank($brand->slug)) {
                $brand->slug = static::uniqueSlug($brand->name);
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function imageUrl(): ?string
    {
        return PublicUploadDisk::url($this->image);
    }

    public function logoUrl(): ?string
    {
        return PublicUploadDisk::url($this->logo);
    }

    /**
     * @return array<string, mixed>
     */
    public function toShopFrontArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'url' => $this->url,
            'image_url' => $this->imageUrl(),
            'logo_url' => $this->logoUrl(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            ...$this->toShopFrontArray(),
            'image' => $this->image,
            'logo' => $this->logo,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'brand';
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
