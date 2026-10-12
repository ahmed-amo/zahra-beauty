import type { CategoryPathItem, CategoryTreeNode } from "./types"

export function findCategoryNode(
  tree: CategoryTreeNode[],
  id: number | null | undefined,
): CategoryTreeNode | null {
  if (id == null) return null
  for (const node of tree) {
    if (node.id === id) return node
    const found = findCategoryNode(node.children ?? [], id)
    if (found) return found
  }
  return null
}

/** Root → selected path. */
export function getCategoryPath(
  tree: CategoryTreeNode[],
  id: number | null | undefined,
): CategoryPathItem[] {
  if (id == null) return []

  const walk = (
    nodes: CategoryTreeNode[],
    trail: CategoryPathItem[],
  ): CategoryPathItem[] | null => {
    for (const node of nodes) {
      const next = [...trail, { id: node.id, name: node.name, slug: node.slug }]
      if (node.id === id) return next
      const found = walk(node.children ?? [], next)
      if (found) return found
    }
    return null
  }

  return walk(tree, []) ?? []
}

export function flattenCategoryTree(
  tree: CategoryTreeNode[],
  ancestors: CategoryPathItem[] = [],
): Array<CategoryTreeNode & { path: CategoryPathItem[]; pathLabel: string }> {
  const rows: Array<CategoryTreeNode & { path: CategoryPathItem[]; pathLabel: string }> = []

  for (const node of tree) {
    const path = [...ancestors, { id: node.id, name: node.name, slug: node.slug }]
    rows.push({
      ...node,
      path,
      pathLabel: path.map((p) => p.name).join(" > "),
    })
    rows.push(...flattenCategoryTree(node.children ?? [], path))
  }

  return rows
}

/** Filter tree keeping ancestors of matches and matching nodes. */
export function filterCategoryTree(
  tree: CategoryTreeNode[],
  query: string,
): CategoryTreeNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return tree

  const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
    const childMatches = (node.children ?? [])
      .map(filterNode)
      .filter((n): n is CategoryTreeNode => n !== null)

    const selfMatch =
      node.name.toLowerCase().includes(q) ||
      node.slug.toLowerCase().includes(q)

    if (!selfMatch && childMatches.length === 0) return null

    // Matching ancestors keep full children so the admin can keep browsing;
    // otherwise only matching subtrees are kept.
    const children = selfMatch
      ? childMatches.length > 0
        ? childMatches
        : node.children ?? []
      : childMatches

    return {
      ...node,
      children,
      has_children: children.length > 0,
      is_leaf: children.length === 0,
    }
  }

  return tree.map(filterNode).filter((n): n is CategoryTreeNode => n !== null)
}

/** Ids that should be expanded so the selected node is visible. */
export function expandIdsForSelection(
  tree: CategoryTreeNode[],
  selectedId: number | null | undefined,
): Set<number> {
  const path = getCategoryPath(tree, selectedId)
  // Expand every ancestor (not the leaf itself unless it has children)
  const ids = new Set<number>()
  for (let i = 0; i < path.length - 1; i++) {
    ids.add(path[i].id)
  }
  return ids
}

export function collectExpandIdsMatchingSearch(
  tree: CategoryTreeNode[],
  query: string,
): Set<number> {
  const q = query.trim().toLowerCase()
  const ids = new Set<number>()
  if (!q) return ids

  const walk = (nodes: CategoryTreeNode[], ancestors: number[]) => {
    for (const node of nodes) {
      const match =
        node.name.toLowerCase().includes(q) ||
        node.slug.toLowerCase().includes(q)
      if (match) {
        ancestors.forEach((id) => ids.add(id))
      }
      walk(node.children ?? [], [...ancestors, node.id])
    }
  }

  walk(tree, [])
  return ids
}
