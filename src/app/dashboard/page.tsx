"use client";

import { useEffect, useState } from "react";
import { KanbanBoard, JobApplication, ApplicationStage } from "@/components/kanban/board";
import { ApplicationDetailDrawer } from "@/components/ApplicationDrawer";
import { AddApplicationDialog } from "@/components/AddApplicationDialog";
import { fetchApplications, updateApplicationStage } from "@/lib/applicationsApi";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Derived from `applications` (not a separate snapshot) so the open drawer
  // always reflects the latest data — e.g. a note added here or a stage
  // changed via drag-and-drop elsewhere never goes stale.
  const selectedApp = applications.find((app) => app.id === selectedAppId) ?? null;

  useEffect(() => {
    let cancelled = false;

    fetchApplications()
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Unable to load applications");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectApp = (app: JobApplication) => {
    setSelectedAppId(app.id);
    setIsDrawerOpen(true);
  };

  const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
    try {
      const updated = await updateApplicationStage(appId, newStage);
      setApplications((prev) => prev.map((app) => (app.id === appId ? updated : app)));
    } catch (err) {
      console.error("Failed to update stage, resyncing from server:", err);
      // The board already applied this optimistically during drag — on
      // failure, refetch to fall back to whatever the server actually has
      // rather than leaving the UI showing a stage change that didn't save.
      fetchApplications().then(setApplications).catch(() => {});
    }
  };

  const handleAddApplication = (application: JobApplication) => {
    setApplications((prev) => [application, ...prev]);
  };

  const handleUpdateApplication = (updated: JobApplication) => {
    setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
  };

  return (
    <div className="mx-auto flex w-full max-w-[2000px] flex-1 flex-col gap-4 bg-card p-4 text-card-foreground sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline Board</h1>
          <p className="text-sm text-muted-foreground">Track applications across every stage.</p>
        </div>
        <Button size="sm" className="gap-1 self-start text-xs sm:self-auto" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Application
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading applications...
        </div>
      )}

      {!isLoading && loadError && (
        <div className="flex flex-1 items-center justify-center text-sm text-destructive">{loadError}</div>
      )}

      {!isLoading && !loadError && (
        <KanbanBoard
          applications={applications}
          onApplicationsChange={setApplications}
          onApplicationSelect={handleSelectApp}
          onStageChange={handleStageChange}
        />
      )}

      <ApplicationDetailDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateApplication={handleUpdateApplication}
      />

      <AddApplicationDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={handleAddApplication}
        applications={applications}
      />
    </div>
  );
}
