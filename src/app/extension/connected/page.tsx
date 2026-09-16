import { CheckCircle2 } from "lucide-react";

export default function ExtensionConnectedPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-card p-6 text-card-foreground">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <h1 className="text-lg font-semibold">You&apos;re connected</h1>
        <p className="text-sm text-muted-foreground">
          CareerTrack is now linked to the browser extension. You can close this tab.
        </p>
      </div>
    </div>
  );
}
