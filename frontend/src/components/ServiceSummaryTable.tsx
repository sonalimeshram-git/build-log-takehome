import { formatRate, formatUtc } from "../format";
import type { ServiceSummary } from "../types";
import StatusBadge from "./StatusBadge";

interface Props {
  services: ServiceSummary[] | null;
  error: string | null;
  onRetry: () => void;
}

/** GET /api/services/: one row per service. The parent fetches the data (the builds filter needs it too). */
export default function ServiceSummaryTable({ services, error, onRetry }: Props) {
  if (error) {
    return (
      <p role="alert">
        Could not load the service summary: {error} <button onClick={onRetry}>Retry</button>
      </p>
    );
  }
  if (services === null) return <p>Loading services…</p>;
  if (services.length === 0) return <p>No builds recorded yet.</p>;

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th className="num">Builds</th>
            <th className="num">Success rate</th>
            <th>Latest</th>
            <th>Latest started</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.service}>
              <td>{s.service}</td>
              <td className="num">{s.total_builds}</td>
              <td
                className="num"
                title={`${s.success_count} success, ${s.failed_count} failed, ${s.cancelled_count} cancelled`}
              >
                {formatRate(s.success_rate)}
              </td>
              <td>
                <StatusBadge status={s.latest_status} />
              </td>
              <td>{formatUtc(s.latest_started_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Success rate = success ÷ (success + failed). Cancelled builds are not counted.</p>
    </>
  );
}