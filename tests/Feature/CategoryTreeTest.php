<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

function admin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

it('lists products from sub-categories on the parent category page', function () {
    $parent = Category::factory()->create(['name' => 'Puériculture', 'slug' => 'puericulture']);
    $child = Category::factory()->childOf($parent)->create(['name' => 'Poussettes', 'slug' => 'poussettes']);

    $onParent = Product::factory()->create(['category_id' => $parent->id, 'status' => true]);
    $onChild = Product::factory()->create(['category_id' => $child->id, 'status' => true]);
    $elsewhere = Product::factory()->create([
        'category_id' => Category::factory()->create()->id,
        'status' => true,
    ]);

    $response = $this->get('/category/puericulture');

    $response->assertOk();

    $names = collect($response->viewData('page')['props']['products']['data'])->pluck('name');

    expect($names)->toContain($onParent->name)
        ->and($names)->toContain($onChild->name)
        ->and($names)->not->toContain($elsewhere->name);
});

it('exposes sub-categories and a breadcrumb on the category page', function () {
    $parent = Category::factory()->create(['name' => 'Chambre', 'slug' => 'chambre']);
    Category::factory()->childOf($parent)->create(['name' => 'Lits', 'slug' => 'lits']);
    $child = Category::factory()->childOf($parent)->create(['name' => 'Linge de lit', 'slug' => 'linge-de-lit']);

    $parentProps = $this->get('/category/chambre')->viewData('page')['props']['category'];

    expect($parentProps['children'])->toHaveCount(2)
        ->and($parentProps['breadcrumb'])->toHaveCount(1);

    $childProps = $this->get('/category/'.$child->slug)->viewData('page')['props']['category'];

    expect($childProps['breadcrumb'])->toHaveCount(2)
        ->and($childProps['breadcrumb'][0]['slug'])->toBe('chambre')
        ->and($childProps['breadcrumb'][1]['slug'])->toBe('linge-de-lit');
});

it('hides inactive sub-categories from the storefront tree', function () {
    $parent = Category::factory()->create(['slug' => 'jouets']);
    Category::factory()->childOf($parent)->create(['name' => 'Peluches']);
    Category::factory()->childOf($parent)->inactive()->create(['name' => 'Archivé']);

    $tree = Category::shopFrontTree();

    expect($tree)->toHaveCount(1)
        ->and($tree->first()['children'])->toHaveCount(1)
        ->and($tree->first()['children'][0]['name'])->toBe('Peluches');
});

it('only returns top level categories in the storefront tree', function () {
    $parent = Category::factory()->create();
    Category::factory()->childOf($parent)->create();

    expect(Category::shopFrontTree())->toHaveCount(1);
});

it('allows nesting categories beyond two levels', function () {
    $parent = Category::factory()->create();
    $child = Category::factory()->childOf($parent)->create();

    $this->actingAs(admin())
        ->post(route('admin.categories.store'), [
            'name' => 'Android',
            'slug' => 'android',
            'parent_id' => $child->id,
        ])
        ->assertRedirect(route('admin.categories'));

    expect(Category::where('slug', 'android')->first()?->parent_id)->toBe($child->id);
});

it('rejects making a category its own parent', function () {
    $category = Category::factory()->create();

    $this->actingAs(admin())
        ->put(route('admin.categories.update', $category), [
            'name' => $category->name,
            'slug' => $category->slug,
            'parent_id' => $category->id,
        ])
        ->assertSessionHasErrors('parent_id');
});

it('rejects moving a parent underneath its own child', function () {
    $parent = Category::factory()->create();
    $child = Category::factory()->childOf($parent)->create();

    $this->actingAs(admin())
        ->put(route('admin.categories.update', $parent), [
            'name' => $parent->name,
            'slug' => $parent->slug,
            'parent_id' => $child->id,
        ])
        ->assertSessionHasErrors('parent_id');

    expect($parent->fresh()->parent_id)->toBeNull();
});

it('creates a sub-category under a top level parent', function () {
    $parent = Category::factory()->create();

    $this->actingAs(admin())
        ->post(route('admin.categories.store'), [
            'name' => 'Poussettes',
            'slug' => 'poussettes',
            'parent_id' => $parent->id,
            'sort_order' => 3,
        ])
        ->assertRedirect(route('admin.categories'));

    $created = Category::where('slug', 'poussettes')->first();

    expect($created->parent_id)->toBe($parent->id)
        ->and($created->sort_order)->toBe(3);
});

it('refuses to delete a category that still has sub-categories', function () {
    $parent = Category::factory()->create();
    Category::factory()->childOf($parent)->create();

    $this->actingAs(admin())
        ->from(route('admin.categories'))
        ->delete(route('admin.categories.destroy', $parent));

    expect(Category::whereKey($parent->id)->exists())->toBeTrue();
});

it('refuses to delete a category that still has products', function () {
    $category = Category::factory()->create();
    Product::factory()->create(['category_id' => $category->id]);

    $this->actingAs(admin())
        ->from(route('admin.categories'))
        ->delete(route('admin.categories.destroy', $category));

    expect(Category::whereKey($category->id)->exists())->toBeTrue();
});

it('blocks non-admins from creating categories', function () {
    $this->actingAs(User::factory()->create(['role' => 'client']))
        ->post(route('admin.categories.store'), ['name' => 'Nope', 'slug' => 'nope'])
        ->assertForbidden();
});

it('auto-generates a category slug when the admin omits it', function () {
    $this->actingAs(admin())
        ->post(route('admin.categories.store'), [
            'name' => 'New Born Essentials',
        ])
        ->assertRedirect(route('admin.categories'));

    $category = Category::where('name', 'New Born Essentials')->first();

    expect($category)->not->toBeNull()
        ->and($category->slug)->toBe('new-born-essentials');
});

it('stores uploaded category images on the public disk so they are web-visible', function () {
    $file = Illuminate\Http\UploadedFile::fake()->image('naissance.jpg', 200, 200);

    $this->actingAs(admin())
        ->post(route('admin.categories.store'), [
            'name' => 'Cover Test',
            'slug' => 'cover-test',
            'image' => $file,
        ])
        ->assertRedirect(route('admin.categories'));

    $category = Category::where('slug', 'cover-test')->first();

    expect($category)->not->toBeNull()
        ->and($category->image)->toStartWith('categories/')
        ->and(Illuminate\Support\Facades\Storage::disk('public')->exists($category->image))->toBeTrue()
        ->and($category->imageUrl())->toContain('/storage/categories/');

    $this->actingAs(admin())
        ->get(route('admin.categories'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Admin/CategoriesDash')
            ->has('categories.data', 1)
            ->where('categories.data.0.image_url', $category->imageUrl()));
});

it('normalizes legacy storage/ prefixes and catpics paths into root-relative urls', function () {
    $disk = Illuminate\Support\Facades\Storage::disk('public');
    $disk->put('categories/legacy.jpg', 'fake-image');

    expect(App\Support\PublicUploadDisk::url('storage/categories/legacy.jpg'))
        ->toBe('/storage/categories/legacy.jpg')
        ->and(App\Support\PublicUploadDisk::url('/storage/categories/legacy.jpg'))
        ->toBe('/storage/categories/legacy.jpg')
        ->and(App\Support\PublicUploadDisk::url('catpics/seed-naissance.webp'))
        ->toBe('/catpics/seed-naissance.webp')
        ->and(App\Support\PublicUploadDisk::url('http://localhost:8000/storage/categories/legacy.jpg'))
        ->toBe('/storage/categories/legacy.jpg')
        ->and(App\Support\PublicUploadDisk::url('https://cdn.example.com/avatars/x.webp'))
        ->toBe('https://cdn.example.com/avatars/x.webp')
        ->and(App\Support\PublicUploadDisk::url('https://wrong-host.railway.internal/storage/brands/a.webp'))
        ->toBe('/storage/brands/a.webp');
});
