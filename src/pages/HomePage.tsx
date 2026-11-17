import { PageHeader } from "@/components/PageHeader";
import { HealthCard } from "@/features/health/components/HealthCard";

export function HomePage() {
  return (
    <>
      <PageHeader
        title="System status"
        description="Whether the API and its database are ready. Tracks arrive in a later release."
      />
      <div className="max-w-2xl">
        <HealthCard />
      </div>
    </>
  );
}
