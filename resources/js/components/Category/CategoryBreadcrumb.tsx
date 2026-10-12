import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryPathItem } from "./types"

interface CategoryBreadcrumbProps {
  path: CategoryPathItem[]
  onNavigate?: (id: number | null) => void
  homeLabel?: string
  className?: string
}

export default function CategoryBreadcrumb({
  path,
  onNavigate,
  homeLabel = "Home",
  className,
}: CategoryBreadcrumbProps) {
  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {onNavigate ? (
            <BreadcrumbLink
              asChild
              className="inline-flex items-center gap-1.5 font-medium"
            >
              <button type="button" onClick={() => onNavigate(null)}>
                <Home className="h-3.5 w-3.5" />
                {homeLabel}
              </button>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="inline-flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              {homeLabel}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {path.map((crumb, index) => {
          const isLast = index === path.length - 1
          return (
            <span key={crumb.id} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !onNavigate ? (
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {crumb.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={() => onNavigate(crumb.id)}>
                      {crumb.name}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
