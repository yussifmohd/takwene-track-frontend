import { PageHeader } from "@/components/PageHeader";
import { HealthCard } from "@/features/health/components/HealthCard";

export function HomePage() {
  return (
    <>
      <PageHeader
        title="System status"
        description="Track and artist management arrive in the next releases. For now, this page shows whether the service is ready."
      />
      <div className="max-w-2xl">
        <HealthCard />
      </div>
    </>
  );
}
