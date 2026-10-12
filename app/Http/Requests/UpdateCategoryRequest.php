<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $category = $this->route('category');

        // Slug stays stable when the admin UI no longer exposes it.
        $slug = $this->input('slug');
        if (blank($slug) && $category instanceof Category) {
            $slug = $category->slug;
        }

        $this->merge([
            'slug' => $slug,
            'parent_id' => $this->input('parent_id') === '' ? null : $this->input('parent_id'),
            'sort_order' => $this->input('sort_order') === '' || $this->input('sort_order') === null
                ? ($category instanceof Category ? (int) $category->sort_order : 0)
                : $this->input('sort_order'),
            'attribute_ids' => array_values(array_filter(
                (array) $this->input('attribute_ids', []),
                fn ($id) => $id !== null && $id !== '',
            )),
        ]);
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category)],
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
            $category = $this->route('category');
            $parentId = $this->input('parent_id');

            if (! $category instanceof Category || $parentId === null) {
                return;
            }

            if ((int) $parentId === $category->id) {
                $validator->errors()->add('parent_id', __('A category cannot be its own parent.'));

                return;
            }

            if (in_array((int) $parentId, $category->selfAndDescendantIds(), true)) {
                $validator->errors()->add('parent_id', __('A category cannot be moved inside one of its own sub-categories.'));

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
}
