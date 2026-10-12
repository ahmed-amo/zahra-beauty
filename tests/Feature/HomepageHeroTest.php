<?php

use App\Models\Brand;
use App\Models\HomepageSetting;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

it('lets admin manage cover brands and hero products', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $products = Product::factory()->count(2)->create(['status' => true]);

    $this->actingAs($admin)
        ->get(route('admin.hero'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Admin/Hero')
            ->has('settings')
            ->has('brands')
            ->has('heroProducts')
            ->has('heroCandidates')
        );

    $cover = UploadedFile::fake()->image('cover.jpg', 1920, 800);

    $this->actingAs($admin)
        ->put(route('admin.hero.cover'), [
            'cover_image' => $cover,
        ])
        ->assertRedirect();

    $settings = HomepageSetting::current()->fresh();
    expect($settings->cover_image)->not->toBeNull();

    $brandImage = UploadedFile::fake()->image('brand.jpg', 800, 1000);

    $this->actingAs($admin)
        ->post(route('admin.hero.brands.store'), [
            'name' => 'Cybex',
            'image' => $brandImage,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect(Brand::query()->where('name', 'Cybex')->exists())->toBeTrue();

    $this->actingAs($admin)
        ->put(route('admin.hero.sync'), [
            'product_ids' => $products->pluck('id')->all(),
        ])
        ->assertRedirect();

    expect(
        Product::query()->whereNotNull('hero_sort_order')->count()
    )->toBe(2);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->where('cover.image_url', fn ($url) => is_string($url) && $url !== '')
            ->has('brands', 1)
            ->has('heroSlides', 2)
        );
});
