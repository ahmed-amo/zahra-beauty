<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Only touch hero order when the form actually sent it (Hero page).
        // Product edit forms no longer include this field.
        if ($this->exists('hero_sort_order')) {
            $v = $this->input('hero_sort_order');
            if ($v === '' || $v === null) {
                $this->merge(['hero_sort_order' => null]);
            }
        }

        if ($this->has('has_variants')) {
            $this->merge([
                'has_variants' => filter_var($this->input('has_variants'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        if ($this->has('variants') && is_string($this->input('variants'))) {
            $decoded = json_decode($this->input('variants'), true);
            if (is_array($decoded)) {
                $this->merge(['variants' => $decoded]);
            }
        }
    }

    public function rules(): array
    {
        $hasVariants = (bool) $this->boolean('has_variants');

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'price' => [$hasVariants ? 'nullable' : 'required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'sale_enabled' => ['sometimes', 'boolean'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
            'category_id' => ['required', 'exists:categories,id'],
            'stock' => [$hasVariants ? 'nullable' : 'required', 'integer', 'min:0'],
            'status' => ['sometimes', 'boolean'],
            'has_variants' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:20488'],
            'gallery_images' => ['nullable', 'array', 'max:5'],
            'gallery_images.*' => ['image', 'max:20488'],
            'replace_gallery' => ['sometimes', 'boolean'],
            'hero_sort_order' => ['nullable', 'integer', 'min:1', 'max:30'],
            'variants' => [$hasVariants ? 'required' : 'nullable', 'array', 'min:1'],
            'variants.*.attribute_value_ids' => [$hasVariants ? 'required' : 'nullable', 'array', 'min:1'],
            'variants.*.attribute_value_ids.*' => ['integer', 'exists:attribute_values,id'],
            'variants.*.barcode' => ['nullable', 'string', 'max:255'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sale_enabled' => ['sometimes', 'boolean'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.weight' => ['nullable', 'numeric', 'min:0'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
            'variants.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $categoryId = $this->input('category_id');

            if (! $categoryId) {
                return;
            }

            if (Category::query()->where('parent_id', $categoryId)->exists()) {
                $validator->errors()->add(
                    'category_id',
                    __('Please select a more specific category.'),
                );
            }
        });
    }
}
