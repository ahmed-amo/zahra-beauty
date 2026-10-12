<?php

namespace App\Http\Controllers;

use App\Mail\OrderConfirmationMail;
use App\Models\BirthListItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\ProductVariant;
use App\Models\User;
use App\Notifications\AdminNewOrderNotification;
use App\Support\AlgeriaLocations;
use App\Support\ProductVariantSync;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index(Request $request, AlgeriaLocations $locations)
    {
        return Inertia::render('Checkout/CheckOutIndex', [
            // paymentMethods kept for future Chargily UI — cash is forced server-side.
            // 'paymentMethods' => $this->enabledPaymentMethods(),
            'wilayas' => $locations->wilayas(),
        ]);
    }

    public function store(Request $request, ProductVariantSync $variantSync, AlgeriaLocations $locations)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|min:3|max:255',
            'customer_phone' => 'required|string|min:9|max:20',
            'customer_email' => 'nullable|email|max:255',
            'wilaya_code' => ['required', 'string', 'size:2'],
            'commune_name' => 'required|string|max:255',
            'delivery_type' => 'required|in:home,business',
            // payment_method intentionally ignored — COD cash until Chargily is wired.
            // 'payment_method' => ['required', 'string', Rule::in($this->enabledPaymentMethods())],
            'cart_items' => 'required|array|min:1',
            'cart_items.*.id' => 'required|exists:products,id',
            'cart_items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'cart_items.*.quantity' => 'required|integer|min:1',
            'cart_items.*.birth_list_item_id' => 'nullable|integer|exists:birth_list_items,id',
        ]);

        $wilayaCode = str_pad($validated['wilaya_code'], 2, '0', STR_PAD_LEFT);
        $wilayaName = $locations->wilayaName($wilayaCode, app()->getLocale());
        if ($wilayaName === null) {
            return back()->withErrors(['wilaya_code' => __('Invalid wilaya selected.')]);
        }

        if (! $locations->communeExists($wilayaCode, $validated['commune_name'])) {
            return back()->withErrors(['commune_name' => __('Invalid commune selected.')]);
        }

        $locale = app()->getLocale();
        $wilayaLabel = $locations->wilayaName($wilayaCode, $locale === 'ar' ? 'ar' : 'fr') ?? $wilayaName;
        $shippingAddress = trim($validated['commune_name'].', '.$wilayaLabel);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['cart_items'] as $cartItem) {
                /** @var Product $product */
                $product = Product::query()
                    ->lockForUpdate()
                    ->findOrFail($cartItem['id']);

                $variantId = isset($cartItem['variant_id']) ? (int) $cartItem['variant_id'] : null;

                /** @var ProductVariant|null $variant */
                $variant = null;

                if ($variantId) {
                    $variant = ProductVariant::query()
                        ->where('product_id', $product->id)
                        ->whereKey($variantId)
                        ->lockForUpdate()
                        ->first();
                } elseif (! $product->has_variants) {
                    $variant = ProductVariant::query()
                        ->where('product_id', $product->id)
                        ->where('is_default', true)
                        ->lockForUpdate()
                        ->first();
                }

                if (! $variant || ! $variant->is_active) {
                    DB::rollBack();

                    return back()->withErrors([
                        'cart' => $product->has_variants
                            ? "Please select a valid option for {$product->name}."
                            : "{$product->name} is unavailable.",
                    ]);
                }

                if ($variant->stock < $cartItem['quantity']) {
                    DB::rollBack();
                    $label = $variant->option_label
                        ? "{$product->name} ({$variant->option_label})"
                        : $product->name;

                    return back()->withErrors(['cart' => "Insufficient stock for {$label}"]);
                }

                $unitPrice = $variant->active_price;
                $itemSubtotal = $unitPrice * $cartItem['quantity'];
                $subtotal += $itemSubtotal;

                $orderItems[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'quantity' => $cartItem['quantity'],
                    'subtotal' => $itemSubtotal,
                    'unit_price' => $unitPrice,
                    'birth_list_item_id' => isset($cartItem['birth_list_item_id'])
                        ? (int) $cartItem['birth_list_item_id']
                        : null,
                ];
            }

            $shippingCost = 80.00;
            $total = $subtotal + $shippingCost;

            $customerEmail = $validated['customer_email']
                ?? Auth::user()?->email
                ?? null;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => Auth::id(),
                'customer_name' => $validated['customer_name'],
                // Empty string when null — SQLite orders.customer_email may still be NOT NULL.
                'customer_email' => $customerEmail ?: '',
                'customer_phone' => $validated['customer_phone'],
                'shipping_address' => $shippingAddress,
                'wilaya_code' => $wilayaCode,
                'wilaya_name' => $wilayaLabel,
                'commune_name' => $validated['commune_name'],
                'delivery_type' => $validated['delivery_type'],
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'payment_method' => 'cash',
                'notes' => null,
                'status' => 'pending',
                'payment_status' => 'pending',
            ]);

            foreach ($orderItems as $item) {
                /** @var ProductVariant $variant */
                $variant = $item['variant'];
                $product = $item['product'];

                $variant->loadMissing(['optionValues.attribute', 'optionValues.attributeValue']);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_sku' => null,
                    'variant_label' => $variant->option_label,
                    'variant_options' => $variant->optionsPayload(),
                    'product_image' => $variant->imageUrl() ?? $product->galleryImageUrl(),
                    'product_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                ]);

                $variant->decrement('stock', $item['quantity']);
                $variantSync->refreshProductAggregates($product->fresh(['variants']));

                if (! empty($item['birth_list_item_id'])) {
                    $registryItem = BirthListItem::query()->find($item['birth_list_item_id']);
                    if (
                        $registryItem
                        && (int) $registryItem->product_id === (int) $product->id
                        && in_array($registryItem->status, [
                            BirthListItem::STATUS_AVAILABLE,
                            BirthListItem::STATUS_RESERVED,
                        ], true)
                    ) {
                        $registryItem->markGifted();
                    }
                }
            }

            DB::commit();

            User::query()
                ->where('role', 'admin')
                ->each(function (User $admin) use ($order): void {
                    $admin->notify(new AdminNewOrderNotification($order));
                });

            if (filled($order->customer_email)) {
                try {
                    Mail::to($order->customer_email)->queue(new OrderConfirmationMail($order));
                } catch (\Throwable $mailException) {
                    report($mailException);
                }
            }

            return Inertia::location(route('orders.success', $order->order_number));
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()->withErrors([
                'checkout' => 'Unable to complete checkout. Please try again or contact support.',
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function enabledPaymentMethods(): array
    {
        // Kept for future Chargily Pay UI — checkout currently forces cash.
        $enabled = array_keys(array_filter(config('payments.methods', [])));

        return $enabled === [] ? ['cash'] : array_values($enabled);
    }

    public function success($orderNumber)
    {
        $order = Order::with('items.product')
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        $reviewedProductIds = ProductReview::query()
            ->where('order_id', $order->id)
            ->pluck('product_id')
            ->all();

        return Inertia::render('Checkout/Success', [
            'order' => [
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'shipping_address' => $order->shipping_address,
                'wilaya_name' => $order->wilaya_name,
                'commune_name' => $order->commune_name,
                'delivery_type' => $order->delivery_type,
                'total' => (float) $order->total,
                'subtotal' => (float) $order->subtotal,
                'tax' => (float) ($order->tax ?? 0),
                'shipping_cost' => (float) $order->shipping_cost,
                'status' => $order->status,
                'payment_method' => $order->payment_method,
                'created_at' => $order->created_at->format('F d, Y'),
                'items' => $order->items
                    ->groupBy('product_id')
                    ->map(function ($group) use ($reviewedProductIds) {
                        $item = $group->first();
                        $name = $item->product_name;
                        if ($item->variant_label) {
                            $name .= ' — '.$item->variant_label;
                        }

                        $productId = (int) $item->product_id;

                        return [
                            'product_id' => $productId,
                            'product_slug' => $item->product?->slug,
                            'product_name' => $name,
                            'variant_label' => $item->variant_label,
                            'quantity' => (int) $group->sum('quantity'),
                            'price' => (float) $item->product_price,
                            'subtotal' => (float) $group->sum('subtotal'),
                            'image' => $item->product_image ?: $item->product?->galleryImageUrl(),
                            'can_rate' => $productId > 0 && ! in_array($productId, $reviewedProductIds, true),
                            'already_rated' => in_array($productId, $reviewedProductIds, true),
                        ];
                    })
                    ->values()
                    ->all(),
            ],
        ]);
    }
}
