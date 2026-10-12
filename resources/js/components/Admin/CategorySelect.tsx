"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CategoryOption {
  id: number
  name: string
  parent_name?: string | null
}

interface Props {
  categories: CategoryOption[]
  value: string
  onValueChange: (value: string) => void
  id?: string
  required?: boolean
  placeholder?: string
}

/**
 * Category picker that shows sous-catégories nested under their parent.
 * Expects the tree-ordered list from ProductController::categoryOptions(),
 * where every parent is immediately followed by its children.
 */
export default function CategorySelect({
  categories,
  value,
  onValueChange,
  id = "category",
  required,
  placeholder = "Select category",
}: Props) {
  const groups: { parent: CategoryOption; children: CategoryOption[] }[] = []

  for (const option of categories) {
    if (!option.parent_name) {
      groups.push({ parent: option, children: [] })
      continue
    }

    if (groups.length > 0) {
      groups[groups.length - 1].children.push(option)
    }
  }

  return (
    <Select value={value} onValueChange={onValueChange} required={required}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available</div>
        ) : (
          groups.map(({ parent, children }) => (
            <SelectGroup key={parent.id}>
              <SelectItem value={parent.id.toString()} className="font-semibold">
                {parent.name}
              </SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id.toString()} className="ps-8 text-muted-foreground">
                  {child.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
