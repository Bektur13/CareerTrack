"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Puzzle, Bell, BarChart3, type LucideIcon } from "lucide-react";

const SEEN_KEY = "ctk_onboarding_seen";

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Puzzle,
    title: "Add applications as you go",
    description:
      "Click \"Add Application\" to log one manually, or install the browser extension to pull the title, company, and description straight off a Greenhouse, LinkedIn, or Handshake posting.",
  },
  {
    icon: LayoutDashboard,
    title: "Track progress on the board",
    description:
      "Drag a card between Applied, Screening, Technical, Offer, or Rejected as things move — the stage updates instantly.",
  },
  {
    icon: Bell,
    title: "Stay on top of follow-ups",
    description:
      "If an application sits in Applied for too long with no movement, it shows up in a reminder banner with a ready-to-edit follow-up email.",
  },
  {
    icon: BarChart3,
    title: "Check your Analytics",
    description:
      "See your submission velocity, interview rate, and offer conversion at a glance — all computed from your real applications.",
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      // localStorage isn't available during SSR, so this can only be
      // checked after mount — same class of exception as theme-toggle.tsx's
      // mounted guard.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      // Private browsing / blocked storage — just skip the intro rather than error.
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Nothing to fall back to here — worst case it shows again next visit.
    }
    setOpen(false);
  };

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to CareerTrack</DialogTitle>
          <DialogDescription>A quick look at how it works.</DialogDescription>
        </DialogHeader>

        <div
          key={step}
          className="flex animate-in fade-in-0 slide-in-from-right-2 flex-col items-center gap-3 py-4 text-center duration-200"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <current.icon className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button type="button" size="sm" onClick={finish}>
                Get Started
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
