import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[2000px] flex-1 flex-col gap-4 bg-card p-4 text-card-foreground sm:p-6 lg:p-8">
      <div>
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">See how your search is trending.</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
