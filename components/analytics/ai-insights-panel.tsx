"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const MIN_ROUNDS = 5;

export function AiInsightsPanel({
  roundCount,
  aiEnabled,
  filterCourseId,
}: {
  roundCount: number;
  aiEnabled: boolean;
  filterCourseId: string | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: filterCourseId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Failed");
      }
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!aiEnabled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold tracking-tight">AI insights</h3>
        </div>
        <Badge variant="outline" className="border-amber-500/40 text-amber-400">
          Add your Claude key in Settings to unlock
        </Badge>
      </div>
    );
  }

  if (roundCount < MIN_ROUNDS) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold tracking-tight">AI insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Log at least {MIN_ROUNDS} rounds to see meaningful AI insights ({roundCount} so far).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold tracking-tight">AI insights</h3>
        </div>
        <Button onClick={generate} disabled={loading} size="sm">
          <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Thinking..." : "Generate insights"}
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {summary && (
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">{summary}</div>
      )}

      {!summary && !loading && (
        <p className="text-sm text-muted-foreground">
          Claude will review your last rounds and call out patterns — strengths, weak hole types,
          courses where you tend to score better or worse.
        </p>
      )}
    </div>
  );
}
