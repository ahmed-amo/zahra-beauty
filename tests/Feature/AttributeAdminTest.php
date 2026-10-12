<?php

use App\Models\Attribute;
use App\Models\Category;
use App\Models\User;

it('admin can create an attribute with values', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.attributes.store'), [
            'name' => 'Couleur',
            'slug' => 'couleur-test-'.uniqid(),
            'sort_order' => 0,
            'is_active' => true,
            'category_ids' => [],
            'values' => [
                ['value' => 'Rouge', 'hex_color' => '#FF0000', 'sort_order' => 0],
                ['value' => 'Bleu', 'hex_color' => null, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect(route('admin.attributes'));

    $attribute = Attribute::query()->where('name', 'Couleur')->first();

    expect($attribute)->not->toBeNull()
        ->and($attribute->values)->toHaveCount(2);
});

it('admin can create an attribute linked to categories', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.attributes.store'), [
            'name' => 'Taille',
            'slug' => 'taille-test-'.uniqid(),
            'sort_order' => 1,
            'is_active' => true,
            'category_ids' => [$category->id],
            'values' => [
                ['value' => 'M', 'sort_order' => 0],
            ],
        ])
        ->assertRedirect(route('admin.attributes'));

    $attribute = Attribute::query()->where('name', 'Taille')->first();

    expect($attribute)->not->toBeNull()
        ->and($attribute->categories()->pluck('categories.id')->all())->toContain($category->id);
});

it('admin can open the add attribute page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.attributes.create'))
        ->assertOk();
});

it('admin can open the attributes index with linked categories', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::factory()->create();
    $attribute = Attribute::query()->create([
        'name' => 'Index Color',
        'slug' => 'index-color-'.uniqid(),
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $attribute->categories()->sync([$category->id => ['sort_order' => 0]]);

    $this->actingAs($admin)
        ->get(route('admin.attributes'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Admin/AttributesDash')
            ->has('attributes.data.0.values')
            ->has('attributes.data.0.products')
            ->missing('attributes.data.0.slug')
        );
});
