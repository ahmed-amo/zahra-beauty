<?php

namespace App\Models;

use App\Support\PublicUploadDisk;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BirthListPack extends Model
{
    public const TYPE_NEWBORN = 'newborn';

    public const TYPE_BABY = 'baby';

    public const TYPE_TODDLER = 'toddler';

    /** @var array<string, string> */
    public const BABY_TYPES = [
        self::TYPE_NEWBORN => 'Nouveau-né',
        self::TYPE_BABY => 'Bébé',
        self::TYPE_TODDLER => 'Bambin',
    ];

    protected $fillable = [
        'name',
        'slug',
        'baby_type',
        'age_band',
        'cover_image',
        'description',
        'sort_order',
        'is_featured',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    protected static function booting(): void
    {
        static::saving(function (BirthListPack $pack) {
            if (! $pack->baby_type || ! array_key_exists($pack->baby_type, self::BABY_TYPES)) {
                $pack->baby_type = self::TYPE_NEWBORN;
            }
            // Keep age_band in sync for older filters / showcase.
            $pack->age_band = self::BABY_TYPES[$pack->baby_type];
        });

        static::creating(function (BirthListPack $pack) {
            if (! $pack->slug) {
                $pack->slug = static::uniqueSlug($pack->name);
            }
        });

        static::updating(function (BirthListPack $pack) {
            if ($pack->isDirty('name') && ! $pack->isDirty('slug')) {
                $pack->slug = static::uniqueSlug($pack->name, $pack->id);
            }
        });
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'pack';
        $slug = $base;
        $n = 0;
        while (
            static::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $n++;
            $slug = $base.'-'.$n;
        }

        return $slug;
    }

    public function items(): HasMany
    {
        return $this->hasMany(BirthListPackItem::class)->orderBy('sort_order')->orderBy('id');
    }

    public function coverImageUrl(): ?string
    {
        return PublicUploadDisk::url($this->cover_image);
    }

    public function babyTypeLabel(): string
    {
        return self::BABY_TYPES[$this->baby_type] ?? self::BABY_TYPES[self::TYPE_NEWBORN];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
