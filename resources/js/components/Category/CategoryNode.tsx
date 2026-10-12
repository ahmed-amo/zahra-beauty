import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronRight, Folder, FolderOpen, FolderTree } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategorySelectMode, CategoryTreeNode } from "./types"

interface CategoryNodeProps {
  node: CategoryTreeNode
  depth?: number
  selectedId: number | null
  expandedIds: Set<number>
  onToggle: (id: number) => void
  onSelect: (node: CategoryTreeNode) => void
  mode?: CategorySelectMode
  /** Prepare for future drag-and-drop without wiring handlers yet. */
  draggableReady?: boolean
}

export default function CategoryNode({
  node,
  depth = 0,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  mode = "leaf",
  draggableReady = true,
}: CategoryNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const expanded = expandedIds.has(node.id)
  const selected = selectedId === node.id
  const selectable = mode === "any" || node.is_leaf || !hasChildren

  const handleRowClick = () => {
    if (hasChildren) {
      onToggle(node.id)
      if (mode === "any") onSelect(node)
      return
    }
    onSelect(node)
  }

  return (
    <div
      className="select-none"
      data-category-id={node.id}
      data-parent-id={node.parent_id ?? ""}
      data-dnd-ready={draggableReady ? "true" : "false"}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleRowClick()
          }
        }}
        style={{ paddingInlineStart: 8 + depth * 16 }}
        className={cn(
          "group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-start transition-all duration-200",
          "hover:border-primary/40 hover:bg-primary/5",
          selected
            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
            : "border-transparent bg-transparent",
        )}
      >
        <button
          type="button"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            hasChildren
              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
              : "text-transparent",
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggle(node.id)
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-90",
              )}
            />
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition",
            selected && "border-primary/40 bg-primary/15 text-primary",
          )}
        >
          {hasChildren ? (
            expanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <FolderTree className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium text-foreground",
                selected && "text-primary",
              )}
            >
              {node.name}
            </span>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {node.products_count}
            </span>
          </div>
          {!selectable && mode === "leaf" ? (
            <p className="truncate text-[11px] text-muted-foreground">
              Choose a subcategory
            </p>
          ) : null}
        </div>

        {selectable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(node)
            }}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground opacity-0 group-hover:opacity-100",
            )}
            aria-label={`Select ${node.name}`}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && expanded ? (
          <motion.div
            key={`children-${node.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ms-3 space-y-1 border-s border-border/60 ps-1 pt-1">
              {node.children.map((child) => (
                <CategoryNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  mode={mode}
                  draggableReady={draggableReady}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
