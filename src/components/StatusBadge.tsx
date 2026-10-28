const styles: Record<string, string> = {
  approved: "bg-success/15 text-success",
  pending: "bg-warning/20 text-accent-foreground",
  submitted: "bg-warning/20 text-accent-foreground",
  rejected: "bg-destructive/15 text-destructive",
  suspended: "bg-destructive/15 text-destructive",
  needs_correction: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
