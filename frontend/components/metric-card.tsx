import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
};

export function MetricCard({ icon: Icon, label, value, note }: MetricCardProps) {
  return (
    <article className="panel metric-card">
      <p className="metric-label">
        <Icon size={17} aria-hidden="true" />
        {label}
      </p>
      <p className="metric-value">{value}</p>
      {note ? <p className="metric-note">{note}</p> : null}
    </article>
  );
}
