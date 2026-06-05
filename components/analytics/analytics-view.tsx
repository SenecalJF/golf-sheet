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
import { BarChart3, Flame, GitCompareArrows, History, Sparkles, TrendingUp } from "lucide-react";
import { ScoreTrendFormatPanel } from "@/components/dashboard/score-trend-format-panel";
import { ParTypeChart } from "@/components/analytics/par-type-chart";
import { HoleHeatmap } from "@/components/analytics/hole-heatmap";
import { HoleHistoryPanel } from "@/components/analytics/hole-history-panel";
import { AiInsightsPanel } from "@/components/analytics/ai-insights-panel";
import { FrontBackPanel } from "@/components/analytics/front-back-panel";
import { CourseCombobox } from "@/components/rounds/course-combobox";
import {
  buildTrend,
  buildHoleHistory,
  countedRounds,
  parTypeBreakdown,
  holeHeatmap,
  frontBackBreakdown,
  summarizeScoreFormat,
  type RoundFull,
  type ScoreFormatSummary,
} from "@/lib/stats";
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
  const [holeCountFilter, setHoleCountFilter] = React.useState<"all" | "18" | "9">("all");
  const statsRounds = countedRounds(rounds);
  const courseFiltered =
    courseId === "all"
      ? statsRounds
      : statsRounds.filter((r) => r.courseId === courseId);
  const filtered =
    holeCountFilter === "all"
      ? courseFiltered
      : courseFiltered.filter((r) => r.holeCount === Number(holeCountFilter));
  const eighteenHoleStats = summarizeScoreFormat(courseFiltered, 18);
  const nineHoleStats = summarizeScoreFormat(courseFiltered, 9);

  const eighteenHoleTrend = buildTrend(filtered.filter((r) => r.holeCount === 18));
  const nineHoleTrend = buildTrend(filtered.filter((r) => r.holeCount === 9));
  const trendInitialFormat = holeCountFilter === "9" ? "9" : "18";
  const parStats = parTypeBreakdown(filtered);
  const heatmap = holeHeatmap(filtered);
  const holeHistory = courseId === "all" ? [] : buildHoleHistory(filtered);
  const frontBack = frontBackBreakdown(filtered);
  const selectedCourse =
    courseId === "all" ? null : courses.find((c) => c.id === courseId) ?? null;

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
        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:min-w-[28rem] sm:grid-cols-2">
          <CourseCombobox
            courses={courses}
            value={courseId}
            onChange={(v) => setCourseId(v || "all")}
            includeAllOption
            triggerClassName="mt-0 h-10"
          />
          <Select
            value={holeCountFilter}
            onValueChange={(v) =>
              setHoleCountFilter(v === "18" || v === "9" ? v : "all")
            }
            items={[
              { label: "All round lengths", value: "all" },
              { label: "18 holes only", value: "18" },
              { label: "9 holes only", value: "9" },
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All round lengths</SelectItem>
              <SelectItem value="18">18 holes only</SelectItem>
              <SelectItem value="9">9 holes only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormatSummaryCard label="18-hole rounds" stat={eighteenHoleStats} />
        <FormatSummaryCard label="9-hole rounds" stat={nineHoleStats} />
      </div>

      <Tabs defaultValue="trend">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="min-w-max">
            <TabsTrigger value="trend">
              <TrendingUp className="mr-1 h-4 w-4" /> Trend
            </TabsTrigger>
            <TabsTrigger value="front-back">
              <GitCompareArrows className="mr-1 h-4 w-4" /> Front/back
            </TabsTrigger>
            <TabsTrigger value="par">
              <BarChart3 className="mr-1 h-4 w-4" /> Par type
            </TabsTrigger>
            <TabsTrigger value="heat">
              <Flame className="mr-1 h-4 w-4" /> Hole heatmap
            </TabsTrigger>
            <TabsTrigger value="hole-history">
              <History className="mr-1 h-4 w-4" /> Hole history
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-1 h-4 w-4" /> AI insights
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trend" className="mt-6">
          <Card className="p-6">
            <ScoreTrendFormatPanel
              key={holeCountFilter}
              eighteenHoleTrend={eighteenHoleTrend}
              nineHoleTrend={nineHoleTrend}
              handicap={index}
              initialFormat={trendInitialFormat}
            />
          </Card>
        </TabsContent>

        <TabsContent value="front-back" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold tracking-tight">
              Front 9 vs back 9
            </h3>
            <FrontBackPanel stats={frontBack} />
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

        <TabsContent value="hole-history" className="mt-6">
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold tracking-tight">Hole history</h3>
            <HoleHistoryPanel
              holes={holeHistory}
              courseSelected={courseId !== "all"}
              courseName={selectedCourse?.name ?? null}
            />
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

function FormatSummaryCard({
  label,
  stat,
}: {
  label: string;
  stat: ScoreFormatSummary;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {stat.rounds} round{stat.rounds === 1 ? "" : "s"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 text-right">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Best
            </div>
            <div className="number-mono text-2xl font-semibold">{stat.best ?? "—"}</div>
            {stat.bestOverPar != null && (
              <div className={scoreTone(stat.bestOverPar)}>
                {stat.bestOverPar >= 0 ? "+" : ""}
                {stat.bestOverPar}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Avg
            </div>
            <div className="number-mono text-2xl font-semibold">{stat.avg ?? "—"}</div>
            {stat.avgOverPar != null && (
              <div className={scoreTone(stat.avgOverPar)}>
                {stat.avgOverPar >= 0 ? "+" : ""}
                {stat.avgOverPar}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function scoreTone(overPar: number): string {
  return (
    "text-xs " +
    (overPar <= 0 ? "text-primary" : overPar < 5 ? "text-amber-400" : "text-destructive")
  );
}
