"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/components/kanban/board";
import { deleteApplication } from "@/lib/applicationsApi";

interface DeleteApplicationDialogProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}

// Shared by both delete entry points (the Kanban card's three-dot menu and
// the drawer's delete button) so the confirmation behaves identically no
// matter where it's triggered from.
export function DeleteApplicationDialog({ application, open, onOpenChange, onDeleted }: DeleteApplicationDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!deleting) {
      onOpenChange(next);
      if (!next) setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!application) return;
    setDeleting(true);
    setError(null);

    try {
      await deleteApplication(application.id);
      onDeleted(application.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete application");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this application?</DialogTitle>
          <DialogDescription>
            {application && (
              <>
                This will permanently remove <strong>{application.jobTitle}</strong> at{" "}
                <strong>{application.companyName}</strong> from your board. This can&apos;t be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={deleting} />}>
            Cancel
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
