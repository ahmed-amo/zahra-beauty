import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CategoryBreadcrumb from "./CategoryBreadcrumb"
import CategoryTree from "./CategoryTree"
import { getCategoryPath } from "./categoryTreeUtils"
import type { CategorySelectMode, CategoryTreeNode } from "./types"

interface CategorySelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: CategoryTreeNode[]
  selectedId?: number | null
  onSelect: (node: CategoryTreeNode) => void
  mode?: CategorySelectMode
  title?: string
  description?: string
}

export default function CategorySelectorModal({
  open,
  onOpenChange,
  tree,
  selectedId = null,
  onSelect,
  mode = "leaf",
  title = "Select a category",
  description = "Browse or search the category tree. Pick the most specific category.",
}: CategorySelectorModalProps) {
  const path = getCategoryPath(tree, selectedId)

  const handleSelect = (node: CategoryTreeNode) => {
    if (mode === "leaf" && node.has_children) return
    onSelect(node)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="space-y-3 border-b border-border px-5 py-4 text-start">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1">{description}</DialogDescription>
          </div>
          <CategoryBreadcrumb
            path={path}
            onNavigate={(id) => {
              if (id === null) return
              const crumb = path.find((p) => p.id === id)
              if (!crumb) return
              // Breadcrumb navigation only expands context; selection stays until leaf pick.
            }}
            homeLabel="All"
          />
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-5 py-4">
          <CategoryTree
            tree={tree}
            selectedId={selectedId}
            onSelect={handleSelect}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
