"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

interface OfferCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string | null;
  companyName: string | null;
}

const CONFETTI_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#a855f7"];

export function OfferCelebration({ open, onOpenChange, jobTitle, companyName }: OfferCelebrationProps) {
  useEffect(() => {
    if (!open) return;

    const end = Date.now() + 1500;
    let frameId: number;

    // Two bursts firing from the bottom corners toward center, repeating
    // for ~1.5s — reads as a continuous celebration rather than one flat pop.
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 60, startVelocity: 45, origin: { x: 0, y: 0.8 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 3, angle: 120, spread: 60, startVelocity: 45, origin: { x: 1, y: 0.8 }, colors: CONFETTI_COLORS });

      if (Date.now() < end) frameId = requestAnimationFrame(frame);
    })();

    return () => cancelAnimationFrame(frameId);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <PartyPopper className="size-7" />
          </div>
          <DialogTitle className="text-xl">Congratulations! 🎉</DialogTitle>
          <DialogDescription>
            {jobTitle && companyName
              ? `You've got an offer for ${jobTitle} at ${companyName}!`
              : "You've got an offer!"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>Nice!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
