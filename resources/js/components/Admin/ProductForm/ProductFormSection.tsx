import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProductFormSectionProps {
  id?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export default function ProductFormSection({
  id,
  title,
  description,
  children,
  className,
  action,
}: ProductFormSectionProps) {
  return (
    <Card
      id={id}
      className={cn(
        "scroll-mt-24 border-border/80 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
