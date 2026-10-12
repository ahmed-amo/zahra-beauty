<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
            $table->string('value');
            $table->string('slug');
            $table->string('hex_color', 7)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['attribute_id', 'slug']);
            $table->index(['attribute_id', 'sort_order']);
        });

        Schema::create('category_attribute', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['category_id', 'attribute_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('has_variants')->default(false)->after('status');
            $table->string('brand')->nullable()->after('description');
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            // null price / sale fields = inherit from the parent product
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->boolean('sale_enabled')->default(false);
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->timestamp('sale_starts_at')->nullable();
            $table->timestamp('sale_ends_at')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->decimal('weight', 10, 3)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->string('option_label')->nullable();
            $table->string('option_hash', 64)->nullable();
            $table->string('image')->nullable();
            $table->json('gallery_urls')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'sku']);
            $table->unique(['product_id', 'option_hash']);
            $table->index(['product_id', 'is_active']);
            $table->index(['product_id', 'is_default']);
        });

        Schema::create('product_variant_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained('attribute_values')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['product_variant_id', 'attribute_id'], 'pvav_variant_attribute_unique');
            $table->index(['attribute_id', 'attribute_value_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('product_variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->nullOnDelete();
            $table->string('variant_sku')->nullable()->after('product_name');
            $table->string('variant_label')->nullable()->after('variant_sku');
            $table->json('variant_options')->nullable()->after('variant_label');
            $table->string('product_image')->nullable()->after('variant_options');
        });

        // Preserve existing catalog: every product gets a default variant that
        // owns its current SKU / price / stock so the storefront keeps working.
        $products = DB::table('products')->select([
            'id', 'sku', 'price', 'compare_at_price', 'sale_enabled', 'sale_price',
            'sale_starts_at', 'sale_ends_at', 'stock', 'image', 'gallery_urls', 'status',
        ])->get();

        $now = now();

        foreach ($products as $product) {
            $sku = filled($product->sku) ? $product->sku : ('PROD-'.$product->id);

            DB::table('product_variants')->insert([
                'product_id' => $product->id,
                'sku' => $sku,
                'barcode' => null,
                'price' => $product->price,
                'compare_at_price' => $product->compare_at_price,
                'sale_enabled' => (bool) $product->sale_enabled,
                'sale_price' => $product->sale_price,
                'sale_starts_at' => $product->sale_starts_at,
                'sale_ends_at' => $product->sale_ends_at,
                'stock' => (int) $product->stock,
                'weight' => null,
                'is_active' => (bool) $product->status,
                'is_default' => true,
                'option_label' => null,
                'option_hash' => 'default',
                'image' => $product->image,
                'gallery_urls' => $product->gallery_urls,
                'sort_order' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_variant_id');
            $table->dropColumn(['variant_sku', 'variant_label', 'variant_options', 'product_image']);
        });

        Schema::dropIfExists('product_variant_attribute_values');
        Schema::dropIfExists('product_variants');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['has_variants', 'brand']);
        });

        Schema::dropIfExists('category_attribute');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attributes');
    }
};
