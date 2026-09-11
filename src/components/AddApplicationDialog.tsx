"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { JobApplication } from "@/components/kanban/board";
import { createApplication } from "@/lib/applicationsApi";

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (application: JobApplication) => void;
  applications: JobApplication[];
}

const EMPTY_FORM = { jobTitle: "", companyName: "", location: "", salaryRange: "", description: "" };

export function AddApplicationDialog({ open, onOpenChange, onAdd, applications }: AddApplicationDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_FORM);
      setError(null);
      setDuplicateWarning(null);
    }
  };

  const submitApplication = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const application = await createApplication({
        jobTitle: form.jobTitle.trim(),
        companyName: form.companyName.trim(),
        location: form.location.trim() || undefined,
        salaryRange: form.salaryRange.trim() || undefined,
        description: form.description.trim() || undefined,
      });

      onAdd(application);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const jobTitle = form.jobTitle.trim();
    const companyName = form.companyName.trim();
    if (!jobTitle || !companyName) return;

    const isDuplicate = applications.some(
      (app) =>
        app.companyName.trim().toLowerCase() === companyName.toLowerCase() &&
        app.jobTitle.trim().toLowerCase() === jobTitle.toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateWarning(`You've already applied to "${jobTitle}" at ${companyName}.`);
      return;
    }

    submitApplication();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {duplicateWarning ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Already applied?</DialogTitle>
            </DialogHeader>

            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{duplicateWarning} Add it again anyway?</p>
            </div>

            {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDuplicateWarning(null)}
                disabled={submitting}
              >
                Go Back
              </Button>
              <Button type="button" onClick={submitApplication} disabled={submitting}>
                {submitting ? "Adding..." : "Yes, Add Anyway"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Job Title
                <Input
                  value={form.jobTitle}
                  onChange={handleChange("jobTitle")}
                  placeholder="Software Engineer"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Company
                <Input
                  value={form.companyName}
                  onChange={handleChange("companyName")}
                  placeholder="Acme Corp"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Location
                <Input value={form.location} onChange={handleChange("location")} placeholder="Remote" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Salary Range
                <Input
                  value={form.salaryRange}
                  onChange={handleChange("salaryRange")}
                  placeholder="$120k - $150k"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Description
                <Input
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="..."
                />
              </label>
            </div>

            {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Application"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
