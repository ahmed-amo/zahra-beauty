<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        if (ProductReview::where('user_id', $user->id)->where('product_id', $product->id)->exists()) {
            return back()->withErrors(['rating' => __('review_duplicate')]);
        }

        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->latest('id')
            ->first();

        if (! $order) {
            return back()->withErrors(['rating' => __('review_not_eligible')]);
        }

        ProductReview::create([
            'user_id' => $user->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'rating' => $validated['rating'],
            'body' => $validated['body'] ?? null,
        ]);

        return back()->with('review_submitted', true);
    }

    /**
     * Rate ordered products from the checkout success page (guest or logged-in).
     */
    public function storeFromOrder(Request $request, string $orderNumber): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:2000'],
        ]);

        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->where('status', '!=', 'cancelled')
            ->firstOrFail();

        $productId = (int) $validated['product_id'];

        $ordered = $order->items()->where('product_id', $productId)->exists();
        if (! $ordered) {
            return back()->withErrors(['rating' => __('review_not_eligible')]);
        }

        if (ProductReview::where('order_id', $order->id)->where('product_id', $productId)->exists()) {
            return back()->withErrors(['rating' => __('review_duplicate')]);
        }

        $user = $request->user();
        if ($user && ProductReview::where('user_id', $user->id)->where('product_id', $productId)->exists()) {
            return back()->withErrors(['rating' => __('review_duplicate')]);
        }

        ProductReview::create([
            'user_id' => $user?->id ?? $order->user_id,
            'order_id' => $order->id,
            'product_id' => $productId,
            'rating' => $validated['rating'],
            'body' => $validated['body'] ?? null,
        ]);

        return back()->with('review_submitted', true);
    }
}
