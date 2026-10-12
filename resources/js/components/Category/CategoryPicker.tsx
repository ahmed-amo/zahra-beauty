import { useMemo, useState } from "react"
import { AlertCircle, ChevronsUpDown, FolderTree, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import CategoryBreadcrumb from "./CategoryBreadcrumb"
import CategorySelectorModal from "./CategorySelectorModal"
import { findCategoryNode, getCategoryPath } from "./categoryTreeUtils"
import type { CategorySelectMode, CategoryTreeNode } from "./types"

interface CategoryPickerProps {
  tree: CategoryTreeNode[]
  value: number | null
  onChange: (id: number | null, node: CategoryTreeNode | null) => void
  mode?: CategorySelectMode
  label?: string
  placeholder?: string
  required?: boolean
  error?: string | null
  className?: string
  allowClear?: boolean
  modalTitle?: string
  modalDescription?: string
}

export default function CategoryPicker({
  tree,
  value,
  onChange,
  mode = "leaf",
  label,
  placeholder = "Choose category",
  required,
  error,
  className,
  allowClear = true,
  modalTitle,
  modalDescription,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(
    () => findCategoryNode(tree, value),
    [tree, value],
  )
  const path = useMemo(() => getCategoryPath(tree, value), [tree, value])

  const nonLeafError =
    mode === "leaf" && selected && selected.has_children
      ? "Please select a more specific category."
      : null

  const displayError = error || nonLeafError

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </p>
        </div>
      ) : null}

      {path.length > 0 ? (
        <CategoryBreadcrumb
          path={path}
          onNavigate={(id) => {
            if (id === null) {
              onChange(null, null)
              return
            }
            const node = findCategoryNode(tree, id)
            if (!node) return
            if (mode === "leaf" && node.has_children) {
              onChange(null, null)
              setOpen(true)
              return
            }
            onChange(node.id, node)
          }}
        />
      ) : null}

      <div
        className={cn(
          "flex items-stretch gap-2 rounded-2xl border bg-card p-2 shadow-sm transition",
          displayError
            ? "border-destructive/50 ring-1 ring-destructive/20"
            : "border-border hover:border-primary/40",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-muted/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderTree className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            {selected ? (
              <>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {selected.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {path.map((p) => p.name).join(" › ")}
                  {" · "}
                  {selected.products_count} products
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-medium text-foreground">
                  {placeholder}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Browse the full category tree
                </span>
              </>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        {allowClear && value != null ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-auto shrink-0 rounded-xl"
            onClick={() => onChange(null, null)}
            aria-label="Clear category"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {displayError ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </p>
      ) : null}

      <CategorySelectorModal
        open={open}
        onOpenChange={setOpen}
        tree={tree}
        selectedId={value}
        mode={mode}
        title={modalTitle}
        description={modalDescription}
        onSelect={(node) => {
          if (mode === "leaf" && node.has_children) return
          onChange(node.id, node)
        }}
      />
    </div>
  )
}
