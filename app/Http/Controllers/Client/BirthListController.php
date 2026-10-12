<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\BirthList;
use App\Models\BirthListItem;
use App\Models\BirthListPack;
use App\Models\Product;
use App\Support\BirthListPresenter;
use App\Support\PublicUploadDisk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BirthListController extends Controller
{
    public function index(): Response
    {
        $lists = BirthList::query()
            ->where('user_id', Auth::id())
            ->withCount('items')
            ->latest()
            ->get()
            ->map(fn (BirthList $list) => BirthListPresenter::listSummary($list))
            ->values();

        return Inertia::render('Dashboard/Client/BirthLists/Index', [
            'lists' => $lists,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Client/BirthLists/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'baby_birth_date' => ['nullable', 'date'],
            'baby_first_name' => ['nullable', 'string', 'max:80'],
            'show_donor_names' => ['sometimes', 'boolean'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'continue_shopping' => ['sometimes', 'boolean'],
        ]);

        $list = new BirthList([
            'user_id' => Auth::id(),
            'name' => $data['name'],
            'baby_birth_date' => $data['baby_birth_date'] ?? null,
            'baby_first_name' => $data['baby_first_name'] ?? null,
            'show_donor_names' => $request->boolean('show_donor_names', true),
            'visibility' => BirthList::VISIBILITY_PRIVATE,
        ]);

        if ($request->hasFile('cover_image')) {
            $list->cover_image = PublicUploadDisk::store('birth-lists', $request->file('cover_image'));
        }

        $list->save();

        $product = null;
        if (! empty($data['product_id'])) {
            $product = Product::query()->find($data['product_id']);
            if ($product) {
                $this->upsertListItem($list, $product, 1, false);
            }
        }

        if ($request->boolean('continue_shopping') || $product) {
            return back()->with('birth_list_toast', $this->toastPayload($list->fresh(), $product));
        }

        return redirect()
            ->route('client.birth-lists.show', $list)
            ->with('success', __('Birth list created'));
    }

    public function show(BirthList $birthList): Response
    {
        $this->authorizeOwner($birthList);

        $birthList->load([
            'items.product',
            'items.contributions' => fn ($q) => $q->latest(),
        ]);
        $birthList->loadCount('items');

        return Inertia::render('Dashboard/Client/BirthLists/Show', [
            'list' => BirthListPresenter::listDetail($birthList, forOwner: true),
        ]);
    }

    public function edit(BirthList $birthList): Response
    {
        $this->authorizeOwner($birthList);

        return Inertia::render('Dashboard/Client/BirthLists/Edit', [
            'list' => BirthListPresenter::listSummary($birthList),
        ]);
    }

    public function update(Request $request, BirthList $birthList): RedirectResponse
    {
        $this->authorizeOwner($birthList);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'baby_birth_date' => ['nullable', 'date'],
            'baby_first_name' => ['nullable', 'string', 'max:80'],
            'show_donor_names' => ['sometimes', 'boolean'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
            'remove_cover' => ['sometimes', 'boolean'],
        ]);

        $birthList->fill([
            'name' => $data['name'],
            'baby_birth_date' => $data['baby_birth_date'] ?? null,
            'baby_first_name' => $data['baby_first_name'] ?? null,
            'show_donor_names' => $request->boolean('show_donor_names', $birthList->show_donor_names),
        ]);

        if ($request->boolean('remove_cover')) {
            PublicUploadDisk::delete($birthList->cover_image);
            $birthList->cover_image = null;
        }

        if ($request->hasFile('cover_image')) {
            PublicUploadDisk::delete($birthList->cover_image);
            $birthList->cover_image = PublicUploadDisk::store('birth-lists', $request->file('cover_image'));
        }

        $birthList->save();

        return redirect()
            ->route('client.birth-lists.show', $birthList)
            ->with('success', __('Birth list updated'));
    }

    public function destroy(BirthList $birthList): RedirectResponse
    {
        $this->authorizeOwner($birthList);
        PublicUploadDisk::delete($birthList->cover_image);
        $birthList->delete();

        return redirect()
            ->route('client.birth-lists.index')
            ->with('success', __('Birth list deleted'));
    }

    public function share(Request $request, BirthList $birthList): RedirectResponse
    {
        $this->authorizeOwner($birthList);

        $data = $request->validate([
            'visibility' => ['required', Rule::in([BirthList::VISIBILITY_PRIVATE, BirthList::VISIBILITY_SHARED])],
        ]);

        $birthList->visibility = $data['visibility'];
        if ($data['visibility'] === BirthList::VISIBILITY_SHARED && ! $birthList->share_token) {
            $birthList->share_token = BirthList::generateShareToken();
        }
        $birthList->save();

        return back()->with('success', __('Share settings updated'));
    }

    public function addProduct(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'birth_list_id' => ['required', 'integer', 'exists:birth_lists,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'allow_cagnotte' => ['sometimes', 'boolean'],
        ]);

        $list = BirthList::query()->findOrFail($data['birth_list_id']);
        $this->authorizeOwner($list);

        $product = Product::query()->findOrFail($data['product_id']);
        $qty = (int) ($data['quantity'] ?? 1);

        $this->upsertListItem(
            $list,
            $product,
            $qty,
            $request->has('allow_cagnotte') ? $request->boolean('allow_cagnotte') : null,
        );

        return back()->with('birth_list_toast', $this->toastPayload($list->fresh(), $product));
    }

    public function preview(BirthList $birthList): \Illuminate\Http\JsonResponse
    {
        $this->authorizeOwner($birthList);

        $birthList->load(['items' => fn ($q) => $q->orderBy('sort_order')->with('product')]);
        $birthList->loadCount('items');

        return response()->json([
            'list' => [
                'id' => $birthList->id,
                'name' => $birthList->name,
                'items_count' => (int) $birthList->items_count,
                'items' => $birthList->items
                    ->map(fn (BirthListItem $item) => [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'status' => $item->status,
                        'product' => BirthListPresenter::productCard($item->product),
                    ])
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function updateItem(Request $request, BirthList $birthList, BirthListItem $item): RedirectResponse
    {
        $this->authorizeOwner($birthList);
        $this->assertItemBelongs($birthList, $item);

        $data = $request->validate([
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'allow_cagnotte' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('quantity', $data)) {
            $item->quantity = $data['quantity'];
        }
        if ($request->has('allow_cagnotte')) {
            $item->allow_cagnotte = $request->boolean('allow_cagnotte');
        }
        if (array_key_exists('sort_order', $data)) {
            $item->sort_order = $data['sort_order'];
        }
        $item->save();

        return back()->with('success', __('Item updated'));
    }

    public function moveItem(Request $request, BirthList $birthList, BirthListItem $item): RedirectResponse
    {
        $this->authorizeOwner($birthList);
        $this->assertItemBelongs($birthList, $item);

        $direction = $request->validate([
            'direction' => ['required', Rule::in(['up', 'down'])],
        ])['direction'];

        $sibling = BirthListItem::query()
            ->where('birth_list_id', $birthList->id)
            ->when(
                $direction === 'up',
                fn ($q) => $q->where('sort_order', '<', $item->sort_order)->orderByDesc('sort_order'),
                fn ($q) => $q->where('sort_order', '>', $item->sort_order)->orderBy('sort_order'),
            )
            ->first();

        if ($sibling) {
            $tmp = $item->sort_order;
            $item->sort_order = $sibling->sort_order;
            $sibling->sort_order = $tmp;
            $item->save();
            $sibling->save();
        }

        return back();
    }

    public function removeItem(BirthList $birthList, BirthListItem $item): RedirectResponse
    {
        $this->authorizeOwner($birthList);
        $this->assertItemBelongs($birthList, $item);
        $item->delete();

        return back()->with('success', __('Item removed'));
    }

    public function cloneFromPack(Request $request, BirthListPack $pack): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'baby_birth_date' => ['nullable', 'date'],
            'baby_first_name' => ['nullable', 'string', 'max:80'],
        ]);

        if (! $pack->is_published && ! Auth::user()?->isAdmin()) {
            abort(404);
        }

        $pack->load('items');

        $list = DB::transaction(function () use ($pack, $data) {
            $list = BirthList::query()->create([
                'user_id' => Auth::id(),
                'name' => $data['name'] ?: $pack->name,
                'baby_birth_date' => $data['baby_birth_date'] ?? null,
                'baby_first_name' => $data['baby_first_name'] ?? null,
                'visibility' => BirthList::VISIBILITY_PRIVATE,
                'show_donor_names' => true,
            ]);

            foreach ($pack->items as $index => $packItem) {
                BirthListItem::query()->create([
                    'birth_list_id' => $list->id,
                    'product_id' => $packItem->product_id,
                    'quantity' => $packItem->quantity,
                    'sort_order' => $index,
                    'allow_cagnotte' => false,
                    'status' => BirthListItem::STATUS_AVAILABLE,
                ]);
            }

            return $list;
        });

        return redirect()
            ->route('client.birth-lists.show', $list)
            ->with('success', __('Pack copied to your birth list'));
    }

    /** JSON helper for product page list picker */
    public function options(): \Illuminate\Http\JsonResponse
    {
        $lists = BirthList::query()
            ->where('user_id', Auth::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['lists' => $lists]);
    }

    private function authorizeOwner(BirthList $list): void
    {
        if (! $list->isOwnedBy(Auth::user())) {
            abort(403);
        }
    }

    private function assertItemBelongs(BirthList $list, BirthListItem $item): void
    {
        if ((int) $item->birth_list_id !== (int) $list->id) {
            abort(404);
        }
    }

    /**
     * @param  bool|null  $allowCagnotte  null = leave existing / default false on create
     */
    private function upsertListItem(BirthList $list, Product $product, int $qty, ?bool $allowCagnotte): void
    {
        $existing = BirthListItem::query()
            ->where('birth_list_id', $list->id)
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            $existing->quantity = min(99, $existing->quantity + $qty);
            if ($allowCagnotte !== null) {
                $existing->allow_cagnotte = $allowCagnotte;
            }
            $existing->save();

            return;
        }

        $maxSort = (int) $list->items()->max('sort_order');
        BirthListItem::query()->create([
            'birth_list_id' => $list->id,
            'product_id' => $product->id,
            'quantity' => $qty,
            'sort_order' => $maxSort + 1,
            'allow_cagnotte' => $allowCagnotte ?? false,
            'status' => BirthListItem::STATUS_AVAILABLE,
        ]);
    }

    private function toastPayload(BirthList $list, ?Product $product): array
    {
        $list->loadCount('items');
        $list->load(['items' => fn ($q) => $q->orderByDesc('updated_at')->with('product')->limit(12)]);

        return [
            'list_id' => $list->id,
            'list_name' => $list->name,
            'items_count' => (int) $list->items_count,
            'product' => $product ? BirthListPresenter::productCard($product) : null,
            'items' => $list->items
                ->map(fn (BirthListItem $item) => [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'status' => $item->status,
                    'product' => BirthListPresenter::productCard($item->product),
                ])
                ->values()
                ->all(),
        ];
    }
}
