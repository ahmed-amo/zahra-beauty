<?php

namespace App\Support;

use App\Models\BirthList;
use App\Models\BirthListItem;
use App\Models\BirthListPack;
use App\Models\BirthListPackItem;
use App\Models\Product;

final class BirthListPresenter
{
    public static function productCard(?Product $product): ?array
    {
        if (! $product) {
            return null;
        }

        $price = (float) $product->price;
        if (method_exists($product, 'isOnSale') && $product->isOnSale() && $product->sale_price !== null) {
            $price = (float) $product->sale_price;
        }

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'price' => $price,
            'image_url' => $product->galleryImageUrl(),
            'status' => (bool) $product->status,
            'is_in_stock' => (bool) $product->is_in_stock,
        ];
    }

    public static function listSummary(BirthList $list): array
    {
        return [
            'id' => $list->id,
            'name' => $list->name,
            'baby_birth_date' => $list->baby_birth_date?->toDateString(),
            'baby_first_name' => $list->baby_first_name,
            'cover_image_url' => $list->coverImageUrl(),
            'visibility' => $list->visibility,
            'is_shared' => $list->isShared(),
            'share_token' => $list->share_token,
            'share_url' => $list->shareUrl(),
            'show_donor_names' => $list->show_donor_names,
            'items_count' => $list->items_count ?? $list->items()->count(),
            'created_at' => $list->created_at?->toIso8601String(),
        ];
    }

    public static function itemPayload(BirthListItem $item, bool $showDonors = true): array
    {
        $product = $item->product;
        $unavailable = $item->productUnavailable();
        $contributed = (float) ($item->contributions_sum_amount
            ?? $item->contributions()->sum('amount'));
        $target = $item->targetPrice();

        $donors = [];
        if ($showDonors && $item->relationLoaded('contributions')) {
            $donors = $item->contributions->map(fn ($c) => [
                'amount' => (float) $c->amount,
                'donor_name' => $c->donor_name,
                'message' => $c->message,
                'created_at' => $c->created_at?->toIso8601String(),
            ])->values()->all();
        }

        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'quantity' => $item->quantity,
            'sort_order' => $item->sort_order,
            'allow_cagnotte' => $item->allow_cagnotte,
            'status' => $item->status,
            'reserved_by_name' => $showDonors ? $item->reserved_by_name : null,
            'reserved_at' => $item->reserved_at?->toIso8601String(),
            'gifted_at' => $item->gifted_at?->toIso8601String(),
            'product_unavailable' => $unavailable,
            'product' => self::productCard($product),
            'cagnotte' => [
                'enabled' => $item->allow_cagnotte,
                'contributed' => $contributed,
                'target' => $target,
                'progress' => $target > 0 ? min(100, round(($contributed / $target) * 100, 1)) : 0,
                'donors' => $donors,
            ],
        ];
    }

    public static function listDetail(BirthList $list, bool $forOwner = false): array
    {
        $showDonors = $forOwner || $list->show_donor_names;

        $items = $list->items
            ->map(fn (BirthListItem $item) => self::itemPayload($item, $showDonors))
            ->values()
            ->all();

        return [
            ...self::listSummary($list),
            'items' => $items,
        ];
    }

    public static function packSummary(BirthListPack $pack): array
    {
        return [
            'id' => $pack->id,
            'name' => $pack->name,
            'slug' => $pack->slug,
            'baby_type' => $pack->baby_type ?: BirthListPack::TYPE_NEWBORN,
            'baby_type_label' => $pack->babyTypeLabel(),
            'age_band' => $pack->age_band ?: $pack->babyTypeLabel(),
            'description' => $pack->description,
            'cover_image_url' => $pack->coverImageUrl(),
            'sort_order' => $pack->sort_order,
            'is_featured' => $pack->is_featured,
            'is_published' => $pack->is_published,
            'items_count' => $pack->items_count ?? $pack->items()->count(),
        ];
    }

    public static function packDetail(BirthListPack $pack): array
    {
        $items = $pack->items->map(function (BirthListPackItem $item) {
            $product = $item->product;
            $unavailable = ! $product
                || ! $product->status
                || ! $product->is_in_stock;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'sort_order' => $item->sort_order,
                'product_unavailable' => $unavailable,
                'product' => self::productCard($product),
            ];
        })->values()->all();

        return [
            ...self::packSummary($pack),
            'items' => $items,
        ];
    }
}
