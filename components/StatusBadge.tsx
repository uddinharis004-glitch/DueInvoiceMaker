const styles: Record<string, string> = {
  PAID: "badge-success",
  UNPAID: "badge-error",
  PARTIAL: "badge-warning",
  OVERDUE: "badge-secondary",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-soft badge-sm font-semibold ${styles[status] ?? "badge-neutral"}`}>
      {status}
    </span>
  );
}
