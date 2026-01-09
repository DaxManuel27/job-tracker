import type { JobStatus } from "../services/api";

const statusConfig: Record<
  JobStatus,
  { label: string; bg: string; text: string }
> = {
  applied: { label: "Applied", bg: "bg-slate-700", text: "text-slate-200" },
  screening: { label: "Screening", bg: "bg-amber-900", text: "text-amber-200" },
  interviewing: { label: "Interviewing", bg: "bg-blue-900", text: "text-blue-200" },
  offer: { label: "Offer", bg: "bg-emerald-900", text: "text-emerald-200" },
  rejected: { label: "Rejected", bg: "bg-red-900", text: "text-red-200" },
  withdrawn: { label: "Withdrawn", bg: "bg-zinc-700", text: "text-zinc-300" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] || statusConfig.applied;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}


