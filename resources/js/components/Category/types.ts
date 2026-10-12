export interface CategoryTreeNode {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description?: string | null
  status?: boolean
  sort_order?: number
  image?: string | null
  image_url?: string | null
  products_count: number
  direct_products_count?: number
  has_children: boolean
  is_leaf: boolean
  children: CategoryTreeNode[]
}

export interface CategoryPathItem {
  id: number
  name: string
  slug?: string
}

export type CategorySelectMode = "leaf" | "any"

/**
 * Drag-and-drop ready node identity helpers (DnD wired later).
 */
export interface CategoryDragPayload {
  id: number
  parent_id: number | null
}
