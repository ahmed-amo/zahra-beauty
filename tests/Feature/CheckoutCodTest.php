<?php

use App\Models\Order;
use App\Models\Product;
use App\Support\AlgeriaLocations;
use App\Support\ProductVariantSync;
use Illuminate\Support\Facades\Mail;

it('exposes 69 wilayas from the pinned Algeria dataset', function () {
    $locations = app(AlgeriaLocations::class);
    $wilayas = $locations->wilayas();

    expect($wilayas)->toHaveCount(69)
        ->and($wilayas[0]['code'])->toBe('01')
        ->and($wilayas[0]['name_fr'])->not->toBeEmpty();
});

it('lists communes for a wilaya', function () {
    $communes = app(AlgeriaLocations::class)->communesForWilaya('16');

    expect($communes)->not->toBeEmpty()
        ->and($communes[0]['name_fr'])->not->toBeEmpty();
});

it('places a COD order without email, notes, or payment selection', function () {
    Mail::fake();

    $product = Product::factory()->create([
        'price' => 2500,
        'stock' => 10,
        'status' => true,
        'has_variants' => false,
    ]);
    app(ProductVariantSync::class)->syncDefaultVariant($product);
    $variant = $product->fresh()->defaultVariant();

    $wilaya = app(AlgeriaLocations::class)->wilayas()[0];
    $commune = app(AlgeriaLocations::class)->communesForWilaya($wilaya['code'])[0];

    $response = $this->post(route('checkout.store'), [
        'customer_name' => 'Amine Benali',
        'customer_phone' => '0555123456',
        'wilaya_code' => $wilaya['code'],
        'commune_name' => $commune['name_fr'],
        'delivery_type' => 'home',
        'cart_items' => [
            [
                'id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $order = Order::query()->latest('id')->first();

    expect($order)->not->toBeNull()
        ->and($order->payment_method)->toBe('cash')
        ->and($order->customer_email)->toBe('')
        ->and($order->notes)->toBeNull()
        ->and($order->wilaya_code)->toBe($wilaya['code'])
        ->and($order->commune_name)->toBe($commune['name_fr'])
        ->and($order->delivery_type)->toBe('home')
        ->and((float) $order->shipping_cost)->toBe(80.0);

    $response->assertRedirect(route('orders.success', $order->order_number));
});

it('rejects checkout without phone or wilaya', function () {
    $product = Product::factory()->create(['stock' => 5, 'status' => true]);
    app(ProductVariantSync::class)->syncDefaultVariant($product);

    $this->post(route('checkout.store'), [
        'customer_name' => 'Amine',
        'customer_phone' => '',
        'wilaya_code' => '',
        'commune_name' => '',
        'delivery_type' => 'home',
        'cart_items' => [
            [
                'id' => $product->id,
                'variant_id' => $product->fresh()->defaultVariant()->id,
                'quantity' => 1,
            ],
        ],
    ])->assertSessionHasErrors(['customer_phone', 'wilaya_code', 'commune_name']);
});

it('serves wilayas and communes JSON endpoints', function () {
    $this->getJson(route('algeria.wilayas'))
        ->assertOk()
        ->assertJsonPath('wilayas.0.code', '01');

    $this->getJson(route('algeria.communes', ['wilayaCode' => '01']))
        ->assertOk()
        ->assertJsonStructure(['wilaya_code', 'communes']);
});
