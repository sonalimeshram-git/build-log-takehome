import { useEffect, useState } from "react";

import { getHealth, type HealthResponse } from "./api";

/**
 * Starting point. Everything below the header is scaffolding you're expected
 * to replace -- see ASSIGNMENT.md items 5 and 6:
 *
 *   - a form that POSTs a build and shows server-side field errors
 *   - the builds table, with its service and status filters
 *   - the per-service summary
 *
 * Structure the app however you like. There's no router or component library
 * installed; add one if you want one, and mention it in DECISIONS.md.
 */
export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <main>
      <h1>Build Log</h1>

      <section>
        <h2>Backend connection</h2>
        {error && <p role="alert">Could not reach the API: {error}</p>}
        {!error && !health && <p>Checking…</p>}
        {health && (
          <p>
            API <strong>{health.status}</strong>, database{" "}
            <strong>{health.database}</strong>. You're wired up — start building.
          </p>
        )}
      </section>

      <section>
        <h2>To build</h2>
        <ol>
          <li>Record-a-build form (POST /api/builds/)</li>
          <li>Builds table with service and status filters (GET /api/builds/)</li>
          <li>Per-service summary (GET /api/services/)</li>
        </ol>
      </section>
    </main>
  );
}
