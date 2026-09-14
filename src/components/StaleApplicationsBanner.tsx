"use client";

import { AlertTriangle, Mail, ChevronRight } from "lucide-react";
import type { JobApplication } from "@/components/kanban/board";

// No scheduled job, no push/email service — this is purely a client-side
// filter over data already on the page. Surfaces the moment the dashboard
// is open; doesn't reach the user when the app is closed (that's the
// "real infra" phase, deliberately deferred).
const STALE_AFTER_DAYS = 10;

function daysSince(dateString: string) {
  const applied = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
}

function buildFollowUpMailto(app: JobApplication, days: number) {
  // Contacts only live in client-side state today (no backend Contact
  // route yet), so this only has a real recipient if one was added this
  // session — falls back to an empty "to" (still opens the mail client
  // with subject/body prefilled, just needs an address typed in).
  const contact = app.contacts?.find((c) => c.email);
  const to = contact?.email ?? "";
  const greeting = contact?.name ? `Hi ${contact.name.split(" ")[0]},` : "Hi,";
  const subject = `Following up: ${app.jobTitle} application at ${app.companyName}`;
  const body = `${greeting}\n\nI wanted to follow up on my application for the ${app.jobTitle} role at ${app.companyName}, submitted ${days} days ago. I remain very interested in the opportunity and would love to hear about next steps.\n\nBest,\n`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface StaleApplicationsBannerProps {
  applications: JobApplication[];
  onSelectApplication: (application: JobApplication) => void;
}

export function StaleApplicationsBanner({ applications, onSelectApplication }: StaleApplicationsBannerProps) {
  const stale = applications
    .filter((app) => app.stage === "APPLIED" && app.dateApplied)
    .map((app) => ({ app, days: daysSince(app.dateApplied!) }))
    .filter(({ days }) => days >= STALE_AFTER_DAYS)
    .sort((a, b) => b.days - a.days);

  if (stale.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="font-medium">
          {stale.length} application{stale.length === 1 ? "" : "s"} may need a follow-up
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {stale.map(({ app, days }) => (
          <div
            key={app.id}
            className="flex items-center justify-between gap-2 rounded-md bg-card/60 px-2.5 py-1.5"
          >
            <button
              type="button"
              onClick={() => onSelectApplication(app)}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-card-foreground hover:underline"
            >
              <span className="truncate">
                <span className="font-medium">{app.companyName}</span> — {app.jobTitle}
              </span>
              <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">{days}d ago</span>
              <a
                href={buildFollowUpMailto(app, days)}
                className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
              >
                <Mail className="size-3" /> Follow up
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
