"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Flame, Sparkles, TrendingUp } from "lucide-react";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ParTypeChart } from "@/components/analytics/par-type-chart";
import { HoleHeatmap } from "@/components/analytics/hole-heatmap";
import { AiInsightsPanel } from "@/components/analytics/ai-insights-panel";
import { buildTrend, parTypeBreakdown, holeHeatmap, type RoundFull } from "@/lib/stats";
import { buildDifferentialsAndIndex } from "@/lib/handicap";
import type { Course } from "@prisma/client";

export function AnalyticsView({
  rounds,
  courses,
  aiEnabled,
}: {
  rounds: RoundFull[];
  courses: Course[];
  aiEnabled: boolean;
}) {
  const [courseId, setCourseId] = React.useState<string>("all");
  const filtered =
    courseId === "all" ? rounds : rounds.filter((r) => r.courseId === courseId);

  const trend = buildTrend(filtered);
  const parStats = parTypeBreakdown(filtered);
  const heatmap = holeHeatmap(filtered);

  const scoring = filtered.map((r) => ({
    id: r.id,
    date: r.date,
    holeCount: r.holeCount as 9 | 18,
    nineType: (r.nineType ?? null) as "front" | "back" | null,
    totalStrokes: r.totalStrokes,
    pars: r.holes.map((h) => h.par),
    holeStrokes: r.holes.map((h) => h.strokes),
    rating: r.tee?.rating ?? null,
    slope: r.tee?.slope ?? null,
    rating9F: r.tee?.rating9F ?? null,
    slope9F: r.tee?.slope9F ?? null,
    rating9B: r.tee?.rating9B ?? null,
    slope9B: r.tee?.slope9B ?? null,
    pcc: r.pcc,
  }));
  const { index } = buildDifferentialsAndIndex(scoring);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Analytics</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            What the numbers say
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} round{filtered.length === 1 ? "" : "s"} included.
          </p>
        </div>
        <div className="w-64">
          <Select
            value={courseId}
            onValueChange={(v) => setCourseId(v ?? "all")}
            items={[
              { label: "All courses", value: "all" },
              ...courses.map((c) => ({ label: c.name, value: c.id })),
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">
            <TrendingUp className="mr-1 h-4 w-4" /> Trend
          </TabsTrigger>
          <TabsTrigger value="par">
            <BarChart3 className="mr-1 h-4 w-4" /> Par type
          </TabsTrigger>
          <TabsTrigger value="heat">
            <Flame className="mr-1 h-4 w-4" /> Hole heatmap
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-4 w-4" /> AI insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold tracking-tight">Score trend</h3>
            <TrendChart trend={trend} handicap={index} />
          </Card>
        </TabsContent>

        <TabsContent value="par" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold tracking-tight">
              Average stroke vs par by hole type
            </h3>
            <ParTypeChart stats={parStats} />
          </Card>
        </TabsContent>

        <TabsContent value="heat" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold tracking-tight">
              Per-hole average vs par
            </h3>
            <HoleHeatmap cells={heatmap} />
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="p-6">
            <AiInsightsPanel
              roundCount={filtered.length}
              aiEnabled={aiEnabled}
              filterCourseId={courseId === "all" ? null : courseId}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
