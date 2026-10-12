<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BirthListContribution extends Model
{
    protected $fillable = [
        'birth_list_item_id',
        'amount',
        'donor_name',
        'donor_email',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(BirthListItem::class, 'birth_list_item_id');
    }
}
