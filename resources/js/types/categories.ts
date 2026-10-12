export interface CategoryTreeNode {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description?: string | null
  status?: boolean | string
  image?: string | null
  image_url?: string | null
  products_count?: number | null
  direct_products_count?: number
  has_children?: boolean
  is_leaf?: boolean
  children?: CategoryTreeNode[]
  size?: "small" | "medium" | "large"
}

/** @deprecated Prefer CategoryTreeNode for nested trees. */
export type Category = CategoryTreeNode

/** A single hop in a category breadcrumb trail, root first. */
export interface CategoryCrumb {
  id: number
  name: string
  slug: string
}
