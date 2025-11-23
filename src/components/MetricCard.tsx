import { Card } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  gradient?: "primary" | "warning" | "accent"
  withBackground?: boolean
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  gradient = "primary",
  withBackground = true,
}: MetricCardProps) {
  return (
    <Card className="p-4 flex items-center gap-4 shadow-sm">
      {/* Ícone com fundo azul */}
      <div
        className={`p-3 rounded-xl bg-blue-100 flex items-center justify-center`}
      >
        <div className="text-blue-600">{icon}</div>
      </div>

      {/* Conteúdo */}
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-end gap-1">
          <h3 className="text-2xl font-bold">{value}</h3>
          {subtitle && (
            <span className="text-xs text-muted-foreground mb-[2px]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}