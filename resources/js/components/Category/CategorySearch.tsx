import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CategorySearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export default function CategorySearch({
  value,
  onChange,
  placeholder = "Search categories…",
  className,
  autoFocus,
}: CategorySearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-11 rounded-xl border-border bg-background pe-10 ps-10 shadow-sm"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
