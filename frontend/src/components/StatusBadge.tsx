import type { BuildStatus } from "../types";

export default function StatusBadge({ status }: { status: BuildStatus }) {
  return <span className={`status status-${status}`}>{status}</span>;
}