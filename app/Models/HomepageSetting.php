<?php

namespace App\Models;

use App\Support\PublicUploadDisk;
use Illuminate\Database\Eloquent\Model;

class HomepageSetting extends Model
{
    protected $fillable = [
        'cover_image',
        'cover_title',
        'cover_subtitle',
        'cover_link',
        'cover_link_label',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    public function coverImageUrl(): ?string
    {
        return PublicUploadDisk::url($this->cover_image);
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            'cover_image' => $this->cover_image,
            'cover_image_url' => $this->coverImageUrl(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function toShopFrontArray(): ?array
    {
        $url = $this->coverImageUrl();
        if (! $url) {
            return null;
        }

        return [
            'image_url' => $url,
        ];
    }
}
