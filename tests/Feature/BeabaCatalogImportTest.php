<?php

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Beaba\BeabaCatalogImporter;
use App\Support\Beaba\BeabaColorNormalizer;
use Illuminate\Support\Facades\Artisan;

beforeEach(function () {
    $fixture = base_path('tests/fixtures/beaba-sample.xlsx');
    if (! is_file($fixture)) {
        require base_path('tests/fixtures/build-beaba-sample.php');
    }
});

it('keeps BEABA web prices as integer DA', function () {
    $importer = app(BeabaCatalogImporter::class);
    $plan = $importer->dryRun(base_path('tests/fixtures/beaba-sample.xlsx'));

    $neo = collect($plan['product_groups'])->firstWhere('name', 'Babycook Neo');

    expect($neo)->not->toBeNull()
        ->and((float) $neo['price'])->toBe(66700.0)
        ->and($plan['price_note'])->toContain('integer DA');
});

it('groups color variants under one parent product', function () {
    Artisan::call('products:import-beaba', [
        'path' => base_path('tests/fixtures/beaba-sample.xlsx'),
    ]);

    $product = Product::query()->where('external_key', 'like', '%babycook neo')->first()
        ?? Product::query()->where('name', 'Babycook Neo')->first();

    expect($product)->not->toBeNull()
        ->and($product->has_variants)->toBeTrue()
        ->and($product->variants()->count())->toBe(3)
        ->and($product->image)->toBeNull()
        ->and($product->gallery_urls)->toBeNull();

    $colors = $product->variants()->pluck('option_label')->filter()->values()->all();
    expect($colors)->toHaveCount(3);

    $colorAttr = Attribute::query()->where('slug', 'color')->first();
    expect($colorAttr)->not->toBeNull()
        ->and($colorAttr->is_global)->toBeTrue();
});

it('imports STOP Exclu Retail and Onliners as inactive variants', function () {
    Artisan::call('products:import-beaba', [
        'path' => base_path('tests/fixtures/beaba-sample.xlsx'),
    ]);

    $stop = ProductVariant::query()->where('barcode', '3384349163001')->first();
    $exclu = ProductVariant::query()->where('barcode', '3384349999001')->first();
    $online = ProductVariant::query()->where('barcode', '3384349999002')->first();

    expect($stop)->not->toBeNull()->and($stop->is_active)->toBeFalse()
        ->and($exclu)->not->toBeNull()->and($exclu->is_active)->toBeFalse()
        ->and($online)->not->toBeNull()->and($online->is_active)->toBeFalse();
});

it('creates French BEABA categories from bilingual labels', function () {
    Artisan::call('products:import-beaba', [
        'path' => base_path('tests/fixtures/beaba-sample.xlsx'),
    ]);

    expect(Category::query()->where('slug', 'repas')->exists())->toBeTrue()
        ->and(Category::query()->where('slug', 'maison')->exists())->toBeTrue()
        ->and(Category::query()->where('slug', 'biberonnerie')->exists())->toBeTrue();

    $repas = Category::query()->where('slug', 'repas')->first();
    expect($repas->name)->toBe('REPAS')
        ->and($repas->description)->toContain('MEALTIME');
});

it('is idempotent when run twice', function () {
    $path = base_path('tests/fixtures/beaba-sample.xlsx');

    Artisan::call('products:import-beaba', ['path' => $path]);
    $firstProducts = Product::query()->where('import_source', BeabaCatalogImporter::SOURCE)->count();
    $firstVariants = ProductVariant::query()->whereNotNull('barcode')->count();

    Artisan::call('products:import-beaba', ['path' => $path]);

    expect(Product::query()->where('import_source', BeabaCatalogImporter::SOURCE)->count())->toBe($firstProducts)
        ->and(ProductVariant::query()->whereNotNull('barcode')->count())->toBe($firstVariants);
});

it('reports duplicate EANs and keeps the first row', function () {
    $importer = app(BeabaCatalogImporter::class);
    $plan = $importer->dryRun(base_path('tests/fixtures/beaba-sample.xlsx'));

    expect($plan['duplicate_eans'])->not->toBeEmpty()
        ->and($plan['duplicate_eans'][0]['ean'])->toBe('3384349134303');

    Artisan::call('products:import-beaba', [
        'path' => base_path('tests/fixtures/beaba-sample.xlsx'),
    ]);

    expect(ProductVariant::query()->where('barcode', '3384349134303')->count())->toBe(1)
        ->and(ProductVariant::query()->where('barcode', '3384349134303')->value('reference'))->toBe('913430')
        ->and(ProductVariant::query()->where('barcode', '3384349134303')->value('import_alternative'))->toBe('REPLACEMENT: 913609');
});

it('does not silently group uncertain color designations', function () {
    $parsed = (new BeabaColorNormalizer)->parse('Set 1er âge 6 portions clip - (2x90ml + 4x150ml)');

    expect($parsed['color'])->toBeNull()
        ->and($parsed['confidence'])->toBe('uncertain');
});
