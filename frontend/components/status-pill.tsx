import type { ApiStatus } from "@/lib/api";

type StatusPillProps = {
  status: ApiStatus;
  label: string;
};

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`status-pill status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
