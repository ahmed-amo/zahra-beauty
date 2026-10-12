export interface ProductReviewItem {
  id: number;
  rating: number;
  body: string | null;
  created_at: string | null;
  user: { name: string; avatar_url: string | null };
}

export interface ProductAttributeValue {
  id: number;
  value: string;
  slug: string;
  hex_color?: string | null;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  values: ProductAttributeValue[];
}

export interface ProductVariantOption {
  attribute_id: number;
  attribute_slug: string | null;
  attribute_name: string | null;
  value_id: number;
  value: string | null;
  value_slug: string | null;
  hex_color?: string | null;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  barcode?: string | null;
  option_label: string | null;
  option_hash?: string | null;
  price: number;
  list_price?: number;
  compare_at_price?: number | null;
  original_display_price?: number | null;
  is_on_sale?: boolean;
  discount_percentage?: number;
  stock: number;
  in_stock: boolean;
  is_active?: boolean;
  is_default?: boolean;
  weight?: number | null;
  image_url?: string | null;
  options: ProductVariantOption[];
  sale_ends_at?: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  brand?: string | null;
  /** Amount the customer pays (active / sale price). */
  price: number;
  list_price?: number;
  compare_at_price?: number | null;
  original_display_price?: number | null;
  is_on_sale?: boolean;
  is_on_sale_effective?: boolean;
  discount_percentage?: number;
  stock: number;
  in_stock: boolean;
  has_variants?: boolean;
  category: string | null;
  category_id: number;
  rating: number;
  image?: string | null;
  image_url?: string | null;
  reviews_count: number;
  /** Populated on product detail page */
  reviews_list?: ProductReviewItem[];
  can_review?: boolean;
  user_review?: { id: number; rating: number; body: string | null } | null;
  images?: string[];
  /** ISO 8601 end time when a scheduled sale has an end date. */
  sale_ends_at?: string | null;
  sale_enabled?: boolean;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  default_variant_id?: number | null;
}

export interface SalesProduct {
  id: number;
  name: string;
  slug: string;
  originalPrice: number;
  price: number;
  discountPercentage: number;
  description: string;
  image_url: string | null;
  category: string | null;
  rating: number;
  stock: number;
}
