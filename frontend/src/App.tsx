import { useEffect, useState } from "react";

import { listServices } from "./api";
import BuildsTable from "./components/BuildsTable";
import ServiceSummaryTable from "./components/ServiceSummaryTable";
import CreateBuildForm from "./components/CreateBuildForm";
import type { ServiceSummary } from "./types";

export default function App() {
  // Bump to reload everything after a change (the create form will call this in Step 5b).
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetched once here because two places need it: the summary table and the service filter.
  const [services, setServices] = useState<ServiceSummary[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesRetry, setServicesRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setServicesError(null);
    listServices(controller.signal)
      .then(setServices)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setServicesError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => controller.abort();
  }, [refreshKey, servicesRetry]);

  const serviceNames = (services ?? []).map((s) => s.service);
  return (
    <main>
      <h1>Build Log</h1>
      <section>
        <h2>Record a build</h2>
        <CreateBuildForm
          serviceNames={serviceNames}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      </section>

      <section>
        <h2>Services</h2>
        <ServiceSummaryTable
          services={services}
          error={servicesError}
          onRetry={() => setServicesRetry((n) => n + 1)}
        />
      </section>

      <section>
        <h2>Builds</h2>
        <BuildsTable serviceNames={(services ?? []).map((s) => s.service)} refreshKey={refreshKey} />
      </section>
    </main>
  );
}