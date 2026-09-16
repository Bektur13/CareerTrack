"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/api-key")
      .then((res) => res.json())
      .then((data) => setApiKey(data.apiKey))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/api-key", { method: "POST" });
      const data = await res.json();
      setApiKey(data.apiKey);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto flex w-full max-w-[2000px] flex-1 flex-col gap-4 bg-card p-4 text-card-foreground sm:p-6 lg:p-8">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your CareerTrack browser extension API key.
        </p>
      </div>

      <div className="max-w-md space-y-2 rounded-lg border border-border bg-card p-4">
        <span className="text-xs text-muted-foreground">Extension API key</span>
        <div className="flex gap-2">
          <Input
            readOnly
            value={loading ? "Loading..." : apiKey ?? "No key yet"}
            className="font-mono text-xs"
          />
          <Button variant="outline" size="icon" onClick={handleCopy} disabled={!apiKey}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          {apiKey ? "Regenerate" : "Generate"} key
        </Button>
        <p className="text-xs text-muted-foreground">
          Paste this into the CareerTrack browser extension popup. Regenerating invalidates the
          previous key.
        </p>
      </div>
    </div>
  );
}
