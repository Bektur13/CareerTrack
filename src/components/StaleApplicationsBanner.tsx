"use client";

import { AlertTriangle, Mail, ChevronRight } from "lucide-react";
import type { JobApplication } from "@/components/kanban/board";
import { daysSince } from "@/lib/dateUtils";

// No scheduled job, no push/email service — this is purely a client-side
// filter over data already on the page. Surfaces the moment the dashboard
// is open; doesn't reach the user when the app is closed (that's the
// "real infra" phase, deliberately deferred).
const STALE_AFTER_DAYS = 10;
// After a follow-up is sent (or dismissed via "Not now"), don't re-nag
// about the same application until this many days have passed again.
const FOLLOW_UP_COOLDOWN_DAYS = 7;

interface StaleApplicationsBannerProps {
  applications: JobApplication[];
  onSelectApplication: (application: JobApplication) => void;
  onFollowUpRequest: (application: JobApplication) => void;
}

export function StaleApplicationsBanner({
  applications,
  onSelectApplication,
  onFollowUpRequest,
}: StaleApplicationsBannerProps) {
  const stale = applications
    .filter((app) => app.stage === "APPLIED" && app.dateApplied)
    .map((app) => ({ app, days: daysSince(app.dateApplied!) }))
    .filter(({ app, days }) => {
      if (days < STALE_AFTER_DAYS) return false;
      if (!app.lastFollowedUpAt) return true;
      return daysSince(app.lastFollowedUpAt) >= FOLLOW_UP_COOLDOWN_DAYS;
    })
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
              <button
                type="button"
                onClick={() => onFollowUpRequest(app)}
                className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
              >
                <Mail className="size-3" /> Follow up
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
