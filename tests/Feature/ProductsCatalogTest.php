<?php

use App\Models\Category;
use App\Models\Product;
use App\Support\ProductVariantSync;

it('shows category grid on products page without category filter', function () {
    $category = Category::factory()->create(['status' => true, 'parent_id' => null]);
    Product::factory()->create(['category_id' => $category->id, 'status' => true]);

    $response = $this->get(route('shop.products'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ProductsCatalog')
            ->has('categories', 1)
            ->where('selectedCategory', null)
            ->where('products', null)
        );
});

it('paginates products by category ten per page', function () {
    $category = Category::factory()->create([
        'status' => true,
        'parent_id' => null,
        'slug' => 'test-repas',
    ]);

    for ($i = 0; $i < 12; $i++) {
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'status' => true,
            'has_variants' => false,
        ]);
        app(ProductVariantSync::class)->syncDefaultVariant($product);
    }

    $response = $this->get(route('shop.products', ['category' => 'test-repas']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ProductsCatalog')
            ->where('selectedCategory.slug', 'test-repas')
            ->where('products.per_page', 10)
            ->where('products.total', 12)
            ->where('products.last_page', 2)
            ->has('products.data', 10)
        );
});
