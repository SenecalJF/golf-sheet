"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ExcludeFromStatsToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label className="text-sm font-medium">Doesn&apos;t count toward stats</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            For scrambles, Vegas, best-ball — saved but excluded from handicap &amp; analytics.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={value ? "default" : "outline"}
          aria-pressed={value}
          onClick={() => onChange(!value)}
          className="shrink-0"
        >
          <Users className="mr-1 h-4 w-4" />
          {value ? "Excluded" : "Counts"}
        </Button>
      </div>
    </div>
  );
}
