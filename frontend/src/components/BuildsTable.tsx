import { useEffect, useState } from "react";

import { listBuilds, ValidationError } from "../api";
import { formatDuration, formatUtc, shortSha } from "../format";
import { BUILD_STATUSES, type Build, type BuildStatus, type Paginated } from "../types";
import StatusBadge from "./StatusBadge";

/** Matches PAGE_SIZE in config/settings.py. Only used to show "page X of Y". */
const PAGE_SIZE = 50;

interface Props {
  /** Service names for the filter dropdown (from /api/services/). */
  serviceNames: string[];
  /** Bump this to reload the list, e.g. after a build is created. */
  refreshKey: number;
}

/** GET /api/builds/: newest first, filter by service and status, 50 per page. */
export default function BuildsTable({ serviceNames, refreshKey }: Props) {
  const [service, setService] = useState("");
  const [status, setStatus] = useState<BuildStatus | "">("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  const [data, setData] = useState<Paginated<Build> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cancel the previous request when filters change quickly, so an older
    // response can never arrive late and overwrite a newer one.
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listBuilds({ service: service || undefined, status: status || undefined, page }, controller.signal)
      .then((result) => setData(result))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ValidationError) {
          setError(Object.values(err.fieldErrors).flat().join(" "));
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [service, status, page, refreshKey, retry]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="filters">
        <label>
          Service{" "}
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All services</option>
            {serviceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status{" "}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BuildStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {BUILD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {data && <span className="hint">{data.count} builds</span>}
      </div>

      {error && (
        <p role="alert">
          Could not load builds: {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}

      {!error && data && data.results.length === 0 && !loading && <p>No builds match these filters.</p>}

      {!error && data && data.results.length > 0 && (
        <table className={loading ? "loading" : undefined} aria-busy={loading}>
          <thead>
            <tr>
              <th>Started</th>
              <th>Service</th>
              <th>Branch</th>
              <th>Commit</th>
              <th>Status</th>
              <th className="num">Duration</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((b) => (
              <tr key={b.id}>
                <td>{formatUtc(b.started_at)}</td>
                <td>{b.service}</td>
                <td>{b.branch}</td>
                <td>
                  <code title={b.commit_sha}>{shortSha(b.commit_sha)}</code>
                </td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="num">{formatDuration(b.duration_ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!data && loading && <p>Loading builds…</p>}

      {data && data.count > PAGE_SIZE && (
        <div className="pager">
          <button disabled={!data.previous || loading} onClick={() => setPage((p) => p - 1)}>
            ← Newer
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={!data.next || loading} onClick={() => setPage((p) => p + 1)}>
            Older →
          </button>
        </div>
      )}
    </div>
  );
}