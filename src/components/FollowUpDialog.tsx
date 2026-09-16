"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/components/kanban/board";
import { markFollowedUp } from "@/lib/applicationsApi";
import { daysSince } from "@/lib/dateUtils";

interface FollowUpDialogProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFollowedUp: (application: JobApplication) => void;
  onAddContact: (application: JobApplication) => void;
}

function buildTemplate(app: JobApplication, days: number) {
  const contact = app.contacts?.find((c) => c.email);
  const greeting = contact?.name ? `Hi ${contact.name.split(" ")[0]},` : "Hi,";
  return {
    subject: `Following up: ${app.jobTitle} application at ${app.companyName}`,
    body: `${greeting}\n\nI wanted to follow up on my application for the ${app.jobTitle} role at ${app.companyName}, submitted ${days} days ago. I remain very interested in the opportunity and would love to hear about next steps.\n\nBest,\n`,
  };
}

// Keeps <Dialog> mounted at all times (open/close animates normally, same
// as the other dialogs here) — only the inner form swaps per application,
// via a `key` on FollowUpDialogBody rather than a useEffect that syncs
// state from props: giving it a fresh key when the target application
// changes makes React remount it, so its useState initializers naturally
// recompute the template instead of an effect stomping edited-but-stale
// state after the fact.
export function FollowUpDialog({ application, open, onOpenChange, onFollowedUp, onAddContact }: FollowUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {application && (
          <FollowUpDialogBody
            key={application.id}
            application={application}
            onOpenChange={onOpenChange}
            onFollowedUp={onFollowedUp}
            onAddContact={onAddContact}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FollowUpDialogBody({
  application,
  onOpenChange,
  onFollowedUp,
  onAddContact,
}: {
  application: JobApplication;
  onOpenChange: (open: boolean) => void;
  onFollowedUp: (application: JobApplication) => void;
  onAddContact: (application: JobApplication) => void;
}) {
  const contact = application.contacts?.find((c) => c.email);
  const days = application.dateApplied ? daysSince(application.dateApplied) : 0;
  const template = buildTemplate(application, days);

  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkFollowedUp = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const updated = await markFollowedUp(application.id);
      onFollowedUp(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = () => {
    if (!contact?.email) return;
    const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    // Opening the mail client isn't awaitable, so there's no real signal
    // the email was actually sent — this marks "addressed" the moment the
    // user commits to sending, same as every other UI here treats intent.
    handleMarkFollowedUp();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Follow up with {application.companyName}</DialogTitle>
        <DialogDescription>{application.jobTitle}</DialogDescription>
      </DialogHeader>

      {!contact ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            No contact with an email is saved for this application yet — add one first so the
            follow-up has somewhere to go.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onAddContact(application);
            }}
          >
            Add a contact
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input value={contact.email} readOnly className="text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Subject
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Message
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="text-sm" />
          </label>
        </div>
      )}

      {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleMarkFollowedUp} disabled={submitting}>
          {submitting ? "Saving..." : "Not now"}
        </Button>
        {contact && (
          <Button type="button" onClick={handleSendEmail} disabled={submitting}>
            Send Email
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
