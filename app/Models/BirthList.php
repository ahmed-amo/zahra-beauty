<?php

namespace App\Models;

use App\Support\PublicUploadDisk;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BirthList extends Model
{
    public const VISIBILITY_PRIVATE = 'private';

    public const VISIBILITY_SHARED = 'shared';

    protected $fillable = [
        'user_id',
        'name',
        'baby_birth_date',
        'baby_first_name',
        'cover_image',
        'visibility',
        'share_token',
        'show_donor_names',
    ];

    protected function casts(): array
    {
        return [
            'baby_birth_date' => 'date',
            'show_donor_names' => 'boolean',
        ];
    }

    protected static function booting(): void
    {
        static::creating(function (BirthList $list) {
            if (! $list->share_token) {
                $list->share_token = static::generateShareToken();
            }
            if (! $list->visibility) {
                $list->visibility = self::VISIBILITY_PRIVATE;
            }
        });
    }

    public static function generateShareToken(): string
    {
        do {
            $token = Str::random(48);
        } while (static::query()->where('share_token', $token)->exists());

        return $token;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BirthListItem::class)->orderBy('sort_order')->orderBy('id');
    }

    public function isShared(): bool
    {
        return $this->visibility === self::VISIBILITY_SHARED;
    }

    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && (int) $this->user_id === (int) $user->id;
    }

    public function coverImageUrl(): ?string
    {
        return PublicUploadDisk::url($this->cover_image);
    }

    public function shareUrl(): string
    {
        return url('/liste/'.$this->share_token);
    }
}
