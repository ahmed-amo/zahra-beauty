<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\BirthList;
use App\Models\BirthListItem;
use App\Support\BirthListPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BirthListPublicController extends Controller
{
    public function show(string $token): Response
    {
        $list = $this->findSharedList($token);
        $list->load([
            'items.product',
            'items.contributions' => fn ($q) => $q->latest(),
        ]);

        return Inertia::render('BirthLists/PublicShow', [
            'list' => BirthListPresenter::listDetail($list, forOwner: false),
            'isOwner' => $list->isOwnedBy(Auth::user()),
        ]);
    }

    public function reserve(Request $request, string $token, int $item): RedirectResponse
    {
        $list = $this->findSharedList($token);
        $birthItem = $this->findListItem($list, $item);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        if (! $birthItem->tryReserve($data['name'] ?? null, $data['email'] ?? null)) {
            return back()->withErrors(['item' => __('This gift was just reserved by someone else.')]);
        }

        return back()
            ->with('success', __('Gift reserved'))
            ->with('reservation_token', $birthItem->reservation_token);
    }

    public function cancelReserve(Request $request, string $token, int $item): RedirectResponse
    {
        $list = $this->findSharedList($token);
        $birthItem = $this->findListItem($list, $item);

        $data = $request->validate([
            'reservation_token' => ['required', 'string', 'max:64'],
        ]);

        if (! $birthItem->cancelReservation($data['reservation_token'])) {
            return back()->withErrors(['item' => __('Unable to cancel this reservation.')]);
        }

        return back()->with('success', __('Reservation cancelled'));
    }

    public function markGifted(Request $request, string $token, int $item): RedirectResponse
    {
        $list = $this->findSharedList($token);
        $birthItem = $this->findListItem($list, $item);

        $data = $request->validate([
            'reservation_token' => ['nullable', 'string', 'max:64'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        if ($birthItem->status === BirthListItem::STATUS_AVAILABLE) {
            if (! $birthItem->tryReserve($data['name'] ?? null, $data['email'] ?? null)) {
                return back()->withErrors(['item' => __('This gift was just taken by someone else.')]);
            }
            $birthItem->refresh();
        }

        if ($birthItem->status === BirthListItem::STATUS_RESERVED) {
            $incoming = $data['reservation_token'] ?? null;
            // Allow confirming without token (any guest can finalize a reservation),
            // but if a token is sent it must match.
            if (
                is_string($incoming)
                && $incoming !== ''
                && is_string($birthItem->reservation_token)
                && $birthItem->reservation_token !== ''
                && ! hash_equals($birthItem->reservation_token, $incoming)
            ) {
                return back()->withErrors(['item' => __('Invalid reservation.')]);
            }
        }

        if (! $birthItem->markGifted()) {
            return back()->withErrors(['item' => __('Unable to mark as gifted.')]);
        }

        return back()->with('success', __('Marked as gifted'));
    }

    public function contribute(Request $request, string $token, int $item): RedirectResponse
    {
        $list = $this->findSharedList($token);
        $birthItem = $this->findListItem($list, $item);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:999999'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $birthItem->addContribution(
                (float) $data['amount'],
                $data['name'] ?? null,
                $data['email'] ?? null,
                $data['message'] ?? null,
            );
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return back()->withErrors(['amount' => $e->getMessage()]);
        }

        return back()->with('success', __('Contribution recorded'));
    }

    private function findSharedList(string $token): BirthList
    {
        $list = BirthList::query()->where('share_token', $token)->firstOrFail();

        if (! $list->isShared() && ! $list->isOwnedBy(Auth::user())) {
            abort(404);
        }

        return $list;
    }

    private function findListItem(BirthList $list, int $itemId): BirthListItem
    {
        return BirthListItem::query()
            ->where('birth_list_id', $list->id)
            ->whereKey($itemId)
            ->firstOrFail();
    }
}
