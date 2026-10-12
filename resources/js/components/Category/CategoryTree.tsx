import { useEffect, useMemo, useState } from "react"
import { FolderX } from "lucide-react"
import { cn } from "@/lib/utils"
import CategoryNode from "./CategoryNode"
import CategorySearch from "./CategorySearch"
import {
  collectExpandIdsMatchingSearch,
  expandIdsForSelection,
  filterCategoryTree,
} from "./categoryTreeUtils"
import type { CategorySelectMode, CategoryTreeNode } from "./types"

interface CategoryTreeProps {
  tree: CategoryTreeNode[]
  selectedId?: number | null
  onSelect: (node: CategoryTreeNode) => void
  mode?: CategorySelectMode
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
  emptyLabel?: string
}

export default function CategoryTree({
  tree,
  selectedId = null,
  onSelect,
  mode = "leaf",
  searchable = true,
  searchPlaceholder,
  className,
  emptyLabel = "No categories found",
}: CategoryTreeProps) {
  const [query, setQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    expandIdsForSelection(tree, selectedId),
  )

  const filtered = useMemo(
    () => filterCategoryTree(tree, query),
    [tree, query],
  )

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      expandIdsForSelection(tree, selectedId).forEach((id) => next.add(id))
      return next
    })
  }, [selectedId, tree])

  useEffect(() => {
    if (!query.trim()) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      collectExpandIdsMatchingSearch(tree, query).forEach((id) => next.add(id))
      return next
    })
  }, [query, tree])

  const toggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={cn("space-y-3", className)}>
      {searchable ? (
        <CategorySearch
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          autoFocus
        />
      ) : null}

      <div className="max-h-[min(28rem,55vh)] space-y-1 overflow-y-auto pe-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <FolderX className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          filtered.map((node) => (
            <CategoryNode
              key={node.id}
              node={node}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={toggle}
              onSelect={onSelect}
              mode={mode}
            />
          ))
        )}
      </div>
    </div>
  )
}
