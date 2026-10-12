<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $values = array_map(function ($row) {
            if (! is_array($row)) {
                return $row;
            }

            $hex = $row['hex_color'] ?? null;
            $row['hex_color'] = filled($hex) ? $hex : null;

            return $row;
        }, (array) $this->input('values', []));

        $this->merge([
            'sort_order' => $this->exists('sort_order') && $this->input('sort_order') !== '' && $this->input('sort_order') !== null
                ? $this->input('sort_order')
                : null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
            'is_global' => filter_var($this->input('is_global', false), FILTER_VALIDATE_BOOLEAN),
            'category_ids' => array_values(array_filter(
                (array) $this->input('category_ids', []),
                fn ($id) => $id !== null && $id !== '',
            )),
            'values' => array_values($values),
        ]);
    }

    public function rules(): array
    {
        $attribute = $this->route('attribute');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('attributes', 'slug')->ignore($attribute)],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
            'is_global' => ['nullable', 'boolean'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', Rule::exists('categories', 'id')],
            'values' => ['nullable', 'array'],
            'values.*.id' => ['nullable', 'integer', Rule::exists('attribute_values', 'id')],
            'values.*.value' => ['required', 'string', 'max:255'],
            'values.*.hex_color' => ['nullable', 'string', 'max:7', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'values.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
