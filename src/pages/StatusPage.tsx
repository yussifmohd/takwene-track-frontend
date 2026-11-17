import { PageHeader } from "@/components/PageHeader";
import { HealthCard } from "@/features/health/components/HealthCard";

/** The Phase 0 status page, reached from the header's status dot. */
export function StatusPage() {
  return (
    <>
      <PageHeader title="System status" description="Whether the API and its database are ready." />
      <div className="max-w-2xl">
        <HealthCard />
      </div>
    </>
  );
}
