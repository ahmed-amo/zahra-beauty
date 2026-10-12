<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AttributeValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'attribute_id',
        'value',
        'slug',
        'hex_color',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (AttributeValue $value): void {
            if (blank($value->slug)) {
                $value->slug = static::uniqueSlugForAttribute((int) $value->attribute_id, $value->value);
            }
        });
    }

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    public static function uniqueSlugForAttribute(int $attributeId, string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'value';
        $slug = $base;
        $n = 0;

        while (static::query()
            ->where('attribute_id', $attributeId)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $n++;
            $slug = $base.'-'.$n;
        }

        return $slug;
    }
}
