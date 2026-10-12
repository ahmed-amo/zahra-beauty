<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BirthListItem extends Model
{
    public const STATUS_AVAILABLE = 'available';

    public const STATUS_RESERVED = 'reserved';

    public const STATUS_GIFTED = 'gifted';

    protected $fillable = [
        'birth_list_id',
        'product_id',
        'quantity',
        'sort_order',
        'allow_cagnotte',
        'status',
        'reserved_by_name',
        'reserved_by_email',
        'reservation_token',
        'reserved_at',
        'gifted_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'sort_order' => 'integer',
            'allow_cagnotte' => 'boolean',
            'reserved_at' => 'datetime',
            'gifted_at' => 'datetime',
        ];
    }

    public function birthList(): BelongsTo
    {
        return $this->belongsTo(BirthList::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(BirthListContribution::class);
    }

    public function contributedTotal(): float
    {
        return (float) $this->contributions()->sum('amount');
    }

    public function productUnavailable(): bool
    {
        $product = $this->product;

        if (! $product) {
            return true;
        }

        if (! $product->status) {
            return true;
        }

        return ! $product->is_in_stock;
    }

    public function targetPrice(): float
    {
        $product = $this->product;
        if (! $product) {
            return 0.0;
        }

        $unit = (float) ($product->active_price ?? $product->price);

        return round($unit * max(1, (int) $this->quantity), 2);
    }

    /**
     * Atomically reserve an available item. Returns false if already taken.
     */
    public function tryReserve(?string $name, ?string $email): bool
    {
        $token = Str::random(40);

        $updated = static::query()
            ->whereKey($this->id)
            ->where('status', self::STATUS_AVAILABLE)
            ->update([
                'status' => self::STATUS_RESERVED,
                'reserved_by_name' => $name,
                'reserved_by_email' => $email,
                'reservation_token' => $token,
                'reserved_at' => now(),
                'updated_at' => now(),
            ]);

        if ($updated === 1) {
            $this->refresh();

            return true;
        }

        return false;
    }

    public function cancelReservation(?string $reservationToken = null): bool
    {
        $query = static::query()
            ->whereKey($this->id)
            ->where('status', self::STATUS_RESERVED);

        if ($reservationToken) {
            $query->where('reservation_token', $reservationToken);
        }

        $updated = $query->update([
            'status' => self::STATUS_AVAILABLE,
            'reserved_by_name' => null,
            'reserved_by_email' => null,
            'reservation_token' => null,
            'reserved_at' => null,
            'updated_at' => now(),
        ]);

        if ($updated === 1) {
            $this->refresh();

            return true;
        }

        return false;
    }

    public function markGifted(): bool
    {
        $updated = static::query()
            ->whereKey($this->id)
            ->whereIn('status', [self::STATUS_AVAILABLE, self::STATUS_RESERVED])
            ->update([
                'status' => self::STATUS_GIFTED,
                'gifted_at' => now(),
                'updated_at' => now(),
            ]);

        if ($updated === 1) {
            $this->refresh();

            return true;
        }

        return false;
    }

    public function addContribution(float $amount, ?string $name, ?string $email, ?string $message): BirthListContribution
    {
        return DB::transaction(function () use ($amount, $name, $email, $message) {
            /** @var self $item */
            $item = static::query()->lockForUpdate()->findOrFail($this->id);

            if ($item->status === self::STATUS_GIFTED) {
                abort(422, 'Item already gifted.');
            }

            if (! $item->allow_cagnotte) {
                abort(422, 'Cagnotte not enabled for this item.');
            }

            $contribution = $item->contributions()->create([
                'amount' => $amount,
                'donor_name' => $name,
                'donor_email' => $email,
                'message' => $message,
            ]);

            $total = (float) $item->contributions()->sum('amount');
            if ($total >= $item->targetPrice()) {
                $item->forceFill([
                    'status' => self::STATUS_GIFTED,
                    'gifted_at' => now(),
                ])->save();
            }

            $this->refresh();

            return $contribution;
        });
    }
}
