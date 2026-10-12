<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $name = (string) $this->input('name', '');
        $slug = $this->input('slug');

        if (blank($slug) && $name !== '') {
            $slug = $this->uniqueSlug(Str::slug($name));
        }

        $this->merge([
            'slug' => $slug,
            'parent_id' => $this->input('parent_id') === '' ? null : $this->input('parent_id'),
            'sort_order' => $this->input('sort_order') === '' || $this->input('sort_order') === null
                ? 0
                : $this->input('sort_order'),
            'attribute_ids' => array_values(array_filter(
                (array) $this->input('attribute_ids', []),
                fn ($id) => $id !== null && $id !== '',
            )),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'parent_id' => ['nullable', 'integer', Rule::exists('categories', 'id')],
            'image' => ['nullable', 'image', 'max:20488'],
            'attribute_ids' => ['nullable', 'array'],
            'attribute_ids.*' => ['integer', Rule::exists('attributes', 'id')],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $parentId = $this->input('parent_id');

            if ($parentId === null) {
                return;
            }

            $parent = Category::query()->find($parentId);

            if ($parent && $parent->depth() >= Category::MAX_DEPTH) {
                $validator->errors()->add(
                    'parent_id',
                    __('Categories can only be nested :depth levels deep.', ['depth' => Category::MAX_DEPTH]),
                );
            }
        });
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base !== '' ? $base : 'category';
        $candidate = $slug;
        $i = 1;

        while (Category::query()->where('slug', $candidate)->exists()) {
            $candidate = $slug.'-'.$i;
            $i++;
        }

        return $candidate;
    }
}
