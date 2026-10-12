<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BirthListPack;
use App\Models\BirthListPackItem;
use App\Models\Product;
use App\Support\BirthListPresenter;
use App\Support\PublicUploadDisk;
use App\Support\ShopHomeCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BirthListPackController extends Controller
{
    public function index(): Response
    {
        $packs = BirthListPack::query()
            ->withCount('items')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (BirthListPack $pack) => BirthListPresenter::packSummary($pack))
            ->values();

        return Inertia::render('Dashboard/Admin/BirthListPacks/Index', [
            'packs' => $packs,
            'babyTypes' => $this->babyTypeOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Admin/BirthListPacks/Form', [
            'pack' => null,
            'products' => $this->productOptions(),
            'babyTypes' => $this->babyTypeOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $data) {
            $pack = new BirthListPack([
                'name' => $data['name'],
                'baby_type' => $data['baby_type'],
                'description' => $data['description'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_featured' => $request->boolean('is_featured'),
                'is_published' => $request->boolean('is_published', true),
            ]);

            if ($request->hasFile('cover_image')) {
                $pack->cover_image = PublicUploadDisk::store('birth-list-packs', $request->file('cover_image'));
            }

            $pack->save();
            $this->syncItems($pack, $data['items'] ?? []);
        });

        ShopHomeCache::forget();

        return redirect()
            ->route('admin.birth-list-packs.index')
            ->with('success', __('Pack created'));
    }

    public function edit(BirthListPack $birthListPack): Response
    {
        $birthListPack->load(['items.product']);

        return Inertia::render('Dashboard/Admin/BirthListPacks/Form', [
            'pack' => BirthListPresenter::packDetail($birthListPack),
            'products' => $this->productOptions(),
            'babyTypes' => $this->babyTypeOptions(),
        ]);
    }

    public function update(Request $request, BirthListPack $birthListPack): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($request, $birthListPack, $data) {
            $birthListPack->fill([
                'name' => $data['name'],
                'baby_type' => $data['baby_type'],
                'description' => $data['description'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_featured' => $request->boolean('is_featured'),
                'is_published' => $request->boolean('is_published', true),
            ]);

            if ($request->boolean('remove_cover')) {
                PublicUploadDisk::delete($birthListPack->cover_image);
                $birthListPack->cover_image = null;
            }

            if ($request->hasFile('cover_image')) {
                PublicUploadDisk::delete($birthListPack->cover_image);
                $birthListPack->cover_image = PublicUploadDisk::store('birth-list-packs', $request->file('cover_image'));
            }

            $birthListPack->save();
            $this->syncItems($birthListPack, $data['items'] ?? []);
        });

        ShopHomeCache::forget();

        return redirect()
            ->route('admin.birth-list-packs.index')
            ->with('success', __('Pack updated'));
    }

    public function destroy(BirthListPack $birthListPack): RedirectResponse
    {
        PublicUploadDisk::delete($birthListPack->cover_image);
        $birthListPack->delete();
        ShopHomeCache::forget();

        return redirect()
            ->route('admin.birth-list-packs.index')
            ->with('success', __('Pack deleted'));
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'baby_type' => ['required', Rule::in(array_keys(BirthListPack::BABY_TYPES))],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'cover_image' => ['nullable', 'image', 'max:5120'],
            'remove_cover' => ['sometimes', 'boolean'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);
    }

    /** @param  list<array{product_id:int,quantity:int}>  $items */
    private function syncItems(BirthListPack $pack, array $items): void
    {
        $pack->items()->delete();

        $seen = [];
        foreach (array_values($items) as $index => $row) {
            $productId = (int) $row['product_id'];
            if (isset($seen[$productId])) {
                continue;
            }
            $seen[$productId] = true;
            BirthListPackItem::query()->create([
                'birth_list_pack_id' => $pack->id,
                'product_id' => $productId,
                'quantity' => (int) $row['quantity'],
                'sort_order' => $index,
            ]);
        }
    }

    private function productOptions(): array
    {
        return Product::query()
            ->where('status', true)
            ->orderBy('name')
            ->limit(400)
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->active_price,
                'image_url' => $p->galleryImageUrl(),
            ])
            ->values()
            ->all();
    }

    /** @return list<array{value: string, label: string}> */
    private function babyTypeOptions(): array
    {
        return collect(BirthListPack::BABY_TYPES)
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }
}
