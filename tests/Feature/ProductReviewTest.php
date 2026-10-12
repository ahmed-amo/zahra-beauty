<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use App\Support\ProductVariantSync;

it('defaults shop rating to 5 stars when a product has no reviews', function () {
    $product = Product::factory()->create(['status' => true]);
    $product->loadAvg('reviews', 'rating');
    $product->loadCount('reviews');

    $payload = $product->toShopFrontArray();

    expect($payload['rating'])->toBe(5.0)
        ->and($payload['reviews_count'])->toBe(0);
});

it('accepts a guest rating from the order success page', function () {
    $product = Product::factory()->create([
        'price' => 1500,
        'stock' => 5,
        'status' => true,
        'has_variants' => false,
    ]);
    app(ProductVariantSync::class)->syncDefaultVariant($product);

    $order = Order::query()->create([
        'order_number' => Order::generateOrderNumber(),
        'user_id' => null,
        'customer_name' => 'Sara',
        'customer_email' => '',
        'customer_phone' => '0555000000',
        'shipping_address' => 'Alger',
        'subtotal' => 1500,
        'shipping_cost' => 80,
        'total' => 1580,
        'status' => 'pending',
        'payment_method' => 'cash',
        'payment_status' => 'pending',
        'delivery_type' => 'home',
    ]);

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'product_price' => 1500,
        'quantity' => 1,
        'subtotal' => 1500,
    ]);

    $response = $this->from(route('orders.success', $order->order_number))
        ->post(route('orders.reviews.store', $order->order_number), [
            'product_id' => $product->id,
            'rating' => 4,
        ]);

    $response->assertRedirect(route('orders.success', $order->order_number));

    $review = ProductReview::query()->first();
    expect($review)->not->toBeNull()
        ->and($review->product_id)->toBe($product->id)
        ->and($review->order_id)->toBe($order->id)
        ->and($review->rating)->toBe(4)
        ->and($review->user_id)->toBeNull();
});

it('lets a logged-in buyer rate after placing an order without waiting for delivery', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'price' => 2000,
        'stock' => 5,
        'status' => true,
        'has_variants' => false,
    ]);
    app(ProductVariantSync::class)->syncDefaultVariant($product);

    $order = Order::query()->create([
        'order_number' => Order::generateOrderNumber(),
        'user_id' => $user->id,
        'customer_name' => $user->name,
        'customer_email' => $user->email,
        'customer_phone' => '0555111222',
        'shipping_address' => 'Oran',
        'subtotal' => 2000,
        'shipping_cost' => 80,
        'total' => 2080,
        'status' => 'pending',
        'payment_method' => 'cash',
        'payment_status' => 'pending',
        'delivery_type' => 'home',
    ]);

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'product_price' => 2000,
        'quantity' => 1,
        'subtotal' => 2000,
    ]);

    $this->actingAs($user)
        ->from(route('product_detail', $product->slug))
        ->post(route('shop.reviews.store', $product->slug), [
            'rating' => 5,
            'body' => 'Top',
        ])
        ->assertRedirect();

    expect(ProductReview::query()->where('user_id', $user->id)->where('product_id', $product->id)->exists())->toBeTrue();
});
