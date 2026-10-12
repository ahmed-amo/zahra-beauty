import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: ReactNode
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  iconColor?: "primary" | "accent" | "success" | "warning"
}

const iconColorClasses: Record<NonNullable<StatsCardProps["iconColor"]>, string> = {
  warning: "bg-brand-pink-soft text-primary dark:bg-primary/20 dark:text-brand-pink",
  accent: "bg-brand-pink-soft text-brand-dark dark:bg-secondary/20 dark:text-brand-pink",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
}

function StatsCardInner({ title, value, icon: Icon, trend, iconColor = "primary" }: StatsCardProps) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
            {trend && (
              <p
                className={`mt-2 text-sm ${
                  trend.isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={`rounded-lg p-3 ${iconColorClasses[iconColor]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const StatsCard = memo(StatsCardInner)
export default StatsCard
