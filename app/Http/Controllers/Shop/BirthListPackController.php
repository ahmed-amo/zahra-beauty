<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\BirthListPack;
use App\Support\BirthListPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BirthListPackController extends Controller
{
    public function index(Request $request): Response
    {
        $babyType = $request->string('baby_type')->trim()->toString();
        if ($babyType !== '' && ! array_key_exists($babyType, BirthListPack::BABY_TYPES)) {
            $babyType = '';
        }

        $query = BirthListPack::query()
            ->where('is_published', true)
            ->withCount('items')
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($babyType !== '') {
            $query->where('baby_type', $babyType);
        }

        $packs = $query->get()->map(fn (BirthListPack $pack) => BirthListPresenter::packSummary($pack))->values();

        $babyTypes = collect(BirthListPack::BABY_TYPES)
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
            ])
            ->values();

        return Inertia::render('BirthLists/Showcase', [
            'packs' => $packs,
            'babyTypes' => $babyTypes,
            'filters' => [
                'baby_type' => $babyType !== '' ? $babyType : null,
            ],
        ]);
    }

    public function show(BirthListPack $pack): Response
    {
        if (! $pack->is_published) {
            abort(404);
        }

        $pack->load(['items.product']);
        $pack->loadCount('items');

        return Inertia::render('BirthLists/PackShow', [
            'pack' => BirthListPresenter::packDetail($pack),
        ]);
    }
}
