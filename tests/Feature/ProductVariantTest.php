<?php

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Support\ProductVariantSync;

function productAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

it('backfills a default variant for every existing product', function () {
    $product = Product::factory()->create([
        'price' => 1500,
        'stock' => 7,
    ]);

    // Mimic the migration backfill for a newly created product in tests.
    app(ProductVariantSync::class)->syncDefaultVariant($product);

    $variant = $product->fresh()->defaultVariant();

    expect($product->fresh()->has_variants)->toBeFalse()
        ->and($variant)->not->toBeNull()
        ->and($variant->is_default)->toBeTrue()
        ->and((int) $variant->stock)->toBe(7)
        ->and((float) $variant->price)->toBe(1500.0);
});

it('creates a variant matrix and aggregates stock onto the product', function () {
    $category = Category::factory()->create();
    $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color', 'sort_order' => 0]);
    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size', 'sort_order' => 1]);
    $category->attributes()->attach([$color->id, $size->id]);

    $black = AttributeValue::query()->create(['attribute_id' => $color->id, 'value' => 'Black', 'slug' => 'black']);
    $white = AttributeValue::query()->create(['attribute_id' => $color->id, 'value' => 'White', 'slug' => 'white']);
    $m = AttributeValue::query()->create(['attribute_id' => $size->id, 'value' => 'M', 'slug' => 'm']);
    $l = AttributeValue::query()->create(['attribute_id' => $size->id, 'value' => 'L', 'slug' => 'l']);

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'price' => 2000,
        'stock' => 0,
        'has_variants' => true,
    ]);

    app(ProductVariantSync::class)->syncVariantMatrix($product, [
        ['attribute_value_ids' => [$black->id, $m->id], 'price' => 2000, 'stock' => 4],
        ['attribute_value_ids' => [$black->id, $l->id], 'price' => 2100, 'stock' => 2],
        ['attribute_value_ids' => [$white->id, $m->id], 'price' => 2000, 'stock' => 0, 'is_active' => true],
    ]);

    $product->refresh();

    expect($product->has_variants)->toBeTrue()
        ->and($product->variants()->count())->toBe(3)
        ->and((int) $product->stock)->toBe(6)
        ->and((float) $product->price)->toBe(2000.0);

    $payload = $product->load([
        'variants.optionValues.attribute',
        'variants.optionValues.attributeValue',
        'category',
    ])->toShopFrontArray();

    expect($payload['has_variants'])->toBeTrue()
        ->and($payload['variants'])->toHaveCount(3)
        ->and($payload['attributes'])->toHaveCount(2)
        ->and($payload['stock'])->toBe(6);
});

it('rejects duplicate variant combinations', function () {
    $category = Category::factory()->create();
    $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color-dup']);
    $red = AttributeValue::query()->create(['attribute_id' => $color->id, 'value' => 'Red', 'slug' => 'red']);
    $category->attributes()->attach($color->id);

    $product = Product::factory()->create(['category_id' => $category->id, 'has_variants' => true]);

    expect(fn () => app(ProductVariantSync::class)->syncVariantMatrix($product, [
        ['attribute_value_ids' => [$red->id], 'stock' => 1],
        ['attribute_value_ids' => [$red->id], 'stock' => 1],
    ]))->toThrow(\Illuminate\Validation\ValidationException::class);
});

it('checks out a specific variant and decrements only that variant stock', function () {
    $category = Category::factory()->create();
    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size-co']);
    $s41 = AttributeValue::query()->create(['attribute_id' => $size->id, 'value' => '41', 'slug' => '41']);
    $s42 = AttributeValue::query()->create(['attribute_id' => $size->id, 'value' => '42', 'slug' => '42']);
    $category->attributes()->attach($size->id);

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Sneakers',
        'price' => 5000,
        'has_variants' => true,
        'status' => true,
    ]);

    app(ProductVariantSync::class)->syncVariantMatrix($product, [
        ['attribute_value_ids' => [$s41->id], 'price' => 5000, 'stock' => 3],
        ['attribute_value_ids' => [$s42->id], 'price' => 5200, 'stock' => 8],
    ]);

    $variant41 = $product->variants()
        ->whereHas('optionValues', fn ($q) => $q->where('attribute_value_id', $s41->id))
        ->first();
    $variant42 = $product->variants()
        ->whereHas('optionValues', fn ($q) => $q->where('attribute_value_id', $s42->id))
        ->first();

    $response = $this->post('/checkout', [
        'customer_name' => 'Test Buyer',
        'customer_email' => 'buyer@example.com',
        'customer_phone' => '0555123456',
        'delivery_type' => 'home',
        'shipping_address' => 'Algiers, Algeria street 12',
        'payment_method' => 'cash',
        'cart_items' => [
            ['id' => $product->id, 'variant_id' => $variant41->id, 'quantity' => 2],
        ],
    ]);

    $response->assertRedirect();

    expect((int) $variant41->fresh()->stock)->toBe(1)
        ->and((int) $variant42->fresh()->stock)->toBe(8)
        ->and((int) $product->fresh()->stock)->toBe(9);

    $item = Order::query()->latest('id')->first()->items()->first();

    expect($item->product_variant_id)->toBe($variant41->id)
        ->and($item->variant_sku)->toBeNull()
        ->and($item->variant_label)->toBe('41')
        ->and((float) $item->product_price)->toBe(5000.0);
});

it('rejects checkout when a variable product has no variant selected', function () {
    $category = Category::factory()->create();
    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size-req']);
    $s = AttributeValue::query()->create(['attribute_id' => $size->id, 'value' => 'S', 'slug' => 's']);
    $category->attributes()->attach($size->id);

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'has_variants' => true,
        'status' => true,
    ]);

    app(ProductVariantSync::class)->syncVariantMatrix($product, [
        ['attribute_value_ids' => [$s->id], 'stock' => 5, 'price' => 1000],
    ]);

    $this->from('/checkout')
        ->post('/checkout', [
            'customer_name' => 'Test Buyer',
            'customer_email' => 'buyer@example.com',
            'delivery_type' => 'home',
            'shipping_address' => 'Algiers, Algeria street 12',
            'payment_method' => 'cash',
            'cart_items' => [
                ['id' => $product->id, 'quantity' => 1],
            ],
        ])
        ->assertSessionHasErrors('cart');
});

it('exposes variants on the product detail payload', function () {
    $category = Category::factory()->create();
    $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color-pdp']);
    $blue = AttributeValue::query()->create(['attribute_id' => $color->id, 'value' => 'Blue', 'slug' => 'blue']);
    $category->attributes()->attach($color->id);

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Variant Tee',
        'has_variants' => true,
        'status' => true,
    ]);

    app(ProductVariantSync::class)->syncVariantMatrix($product, [
        ['attribute_value_ids' => [$blue->id], 'stock' => 5, 'price' => 2500],
    ]);

    $response = $this->get('/product/'.$product->fresh()->slug);
    $response->assertOk();

    $props = $response->viewData('page')['props']['product'];

    expect($props['has_variants'])->toBeTrue()
        ->and($props['variants'])->toHaveCount(1)
        ->and($props['variants'][0])->not->toHaveKey('sku')
        ->and($props['attributes'])->not->toBeEmpty();
});
