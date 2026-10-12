<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $color = $this->upsertAttribute('Color', 0, true, [
            ['value' => 'Noir', 'hex_color' => '#1A1A1A'],
            ['value' => 'Blanc', 'hex_color' => '#FFFFFF'],
            ['value' => 'Bleu', 'hex_color' => '#4A90D9'],
            ['value' => 'Rose', 'hex_color' => '#F2A7B5'],
            ['value' => 'Beige', 'hex_color' => '#E8D5B7'],
        ]);

        $size = $this->upsertAttribute('Size', 1, true, [
            ['value' => '0-3 mois'],
            ['value' => '3-6 mois'],
            ['value' => '6-12 mois'],
            ['value' => '12-18 mois'],
            ['value' => '18-24 mois'],
        ]);

        $capacity = $this->upsertAttribute('Capacity', 2, false, [
            ['value' => '50ml'],
            ['value' => '100ml'],
            ['value' => '200ml'],
        ]);

        // Globals apply everywhere — no pivot needed.
        $this->assignToCategories($capacity, ['alimentation']);
    }

    /**
     * @param  list<array{value: string, hex_color?: string}>  $values
     */
    private function upsertAttribute(string $name, int $sortOrder, bool $isGlobal, array $values): Attribute
    {
        $attribute = Attribute::query()->updateOrCreate(
            ['slug' => Str::slug($name)],
            [
                'name' => $name,
                'sort_order' => $sortOrder,
                'is_active' => true,
                'is_global' => $isGlobal,
            ],
        );

        foreach ($values as $index => $row) {
            $slug = Str::slug($row['value']) ?: 'value';

            AttributeValue::query()->updateOrCreate(
                [
                    'attribute_id' => $attribute->id,
                    'slug' => $slug,
                ],
                [
                    'value' => $row['value'],
                    'hex_color' => $row['hex_color'] ?? null,
                    'sort_order' => $index,
                ],
            );
        }

        return $attribute;
    }

    /**
     * @param  list<string>  $slugs
     */
    private function assignToCategories(Attribute $attribute, array $slugs): void
    {
        $categories = Category::query()->whereIn('slug', $slugs)->get();

        foreach ($categories as $category) {
            $category->attributes()->syncWithoutDetaching([
                $attribute->id => ['sort_order' => $attribute->sort_order],
            ]);
        }
    }
}
