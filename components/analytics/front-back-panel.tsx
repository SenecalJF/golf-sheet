"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CircleGauge, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrontBackStats, NineSideStat } from "@/lib/stats";

export function FrontBackPanel({ stats }: { stats: FrontBackStats }) {
  const sideDiff =
    stats.front.avgVsPar == null || stats.back.avgVsPar == null
      ? null
      : Math.round((stats.back.avgVsPar - stats.front.avgVsPar) * 10) / 10;

  if (stats.front.nines === 0 && stats.back.nines === 0) {
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        No front/back data yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <SideCard label="Front 9" stat={stats.front} />
        <SideCard label="Back 9" stat={stats.back} />
        <MetricCard
          label="Back vs front"
          value={formatSwing(sideDiff)}
          detail={swingDetail(sideDiff, "side average")}
          tone={toneForSwing(sideDiff)}
        />
        <MetricCard
          label="Better finish"
          value={
            stats.backBetterOrTiedPct == null ? "No full rounds" : `${stats.backBetterOrTiedPct}%`
          }
          detail={
            stats.pairedRounds > 0
              ? `${stats.pairedRounds} full round${stats.pairedRounds === 1 ? "" : "s"} compared`
              : "Needs 18-hole rounds"
          }
          tone={
            stats.backBetterOrTiedPct != null && stats.backBetterOrTiedPct >= 50
              ? "good"
              : "muted"
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-border/60 bg-secondary/25 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CircleGauge className="h-4 w-4 text-primary" />
            Read
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {buildRead(stats, sideDiff)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FinishCard label="Best finish" pair={stats.bestFinish} good />
          <FinishCard label="Biggest fade" pair={stats.worstFinish} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Full-round swing</h4>
            <p className="text-xs text-muted-foreground">
              Back 9 vs front 9. Negative means you finished stronger.
            </p>
          </div>
          {stats.recentSwing != null && (
            <div className={cn("text-xs", toneClass(toneForSwing(stats.recentSwing)))}>
              Last {Math.min(5, stats.pairs.length)}: {formatSwing(stats.recentSwing)}
            </div>
          )}
        </div>
        {stats.pairs.length === 0 ? (
          <div className="grid h-56 place-items-center rounded-lg border border-border/60 bg-secondary/20 text-sm text-muted-foreground">
            Log an 18-hole round to see front/back swing by round.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.pairs} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => String(value).slice(5)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value, name) => [
                    typeof value === "number" ? formatSwing(value) : value,
                    name === "swing" ? "Back vs front" : name,
                  ]}
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.course} · ${value}` : value;
                  }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="swing" radius={[6, 6, 0, 0]}>
                  {stats.pairs.map((p) => (
                    <Cell
                      key={p.roundId}
                      fill={p.swing <= 0 ? "var(--primary)" : "var(--destructive)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function SideCard({ label, stat }: { label: string; stat: NineSideStat }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/25 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono mt-2 text-3xl font-semibold">
        {formatVsPar(stat.avgVsPar)}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {stat.avgStrokes == null
          ? "No data"
          : `${stat.avgStrokes.toFixed(1)} strokes avg · ${stat.nines} nine${
              stat.nines === 1 ? "" : "s"
            }`}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>Best {formatVsPar(stat.bestVsPar)}</span>
        <span>Worst {formatVsPar(stat.worstVsPar)}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "bad" | "muted";
}) {
  const Icon = tone === "good" ? ArrowDownRight : tone === "bad" ? ArrowUpRight : CircleGauge;
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/25 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={cn("h-4 w-4", toneClass(tone))} />
      </div>
      <div className={cn("number-mono mt-2 text-3xl font-semibold", toneClass(tone))}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function FinishCard({
  label,
  pair,
  good = false,
}: {
  label: string;
  pair: FrontBackStats["bestFinish"];
  good?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/25 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {good && <Trophy className="h-3.5 w-3.5 text-primary" />}
        {label}
      </div>
      {pair ? (
        <>
          <div
            className={cn(
              "number-mono mt-2 text-2xl font-semibold",
              toneClass(toneForSwing(pair.swing)),
            )}
          >
            {formatSwing(pair.swing)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {pair.course} · {pair.date}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Front {formatVsPar(pair.frontVsPar)} · Back {formatVsPar(pair.backVsPar)}
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">Needs 18-hole rounds</div>
      )}
    </div>
  );
}

function buildRead(stats: FrontBackStats, sideDiff: number | null): string {
  if (sideDiff == null) {
    return "There is not enough front and back nine data yet to compare both sides.";
  }

  const sideSentence =
    Math.abs(sideDiff) < 0.2
      ? "Your front and back nine averages are basically even."
      : sideDiff > 0
        ? `Your back 9 is costing about ${Math.abs(sideDiff).toFixed(1)} strokes more than your front 9.`
        : `Your back 9 is about ${Math.abs(sideDiff).toFixed(1)} strokes better than your front 9.`;

  if (stats.avgSwing == null) {
    return `${sideSentence} Log more full 18-hole rounds to measure finishing strength inside the same round.`;
  }

  const fullRoundSentence =
    Math.abs(stats.avgSwing) < 0.2
      ? "In full rounds, the front/back swing is almost flat."
      : stats.avgSwing > 0
        ? `In full rounds, you fade by ${Math.abs(stats.avgSwing).toFixed(1)} strokes on average after the turn.`
        : `In full rounds, you improve by ${Math.abs(stats.avgSwing).toFixed(1)} strokes on average after the turn.`;

  const recentSentence =
    stats.recentSwing == null
      ? ""
      : stats.recentSwing > stats.avgSwing + 0.5
        ? " Your recent finishes are weaker than your baseline."
        : stats.recentSwing < stats.avgSwing - 0.5
          ? " Your recent finishes are stronger than your baseline."
          : " Your recent finishes are in line with your baseline.";

  return `${sideSentence} ${fullRoundSentence}${recentSentence}`;
}

function formatVsPar(value: number | null): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatSwing(value: number | null): string {
  if (value == null) return "-";
  if (Math.abs(value) < 0.05) return "Even";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function swingDetail(value: number | null, fallback: string): string {
  if (value == null) return "Need both sides";
  if (Math.abs(value) < 0.2) return `Even ${fallback}`;
  return value > 0
    ? `Back is worse by ${value.toFixed(1)}`
    : `Back is better by ${Math.abs(value).toFixed(1)}`;
}

function toneForSwing(value: number | null): "good" | "bad" | "muted" {
  if (value == null || Math.abs(value) < 0.2) return "muted";
  return value < 0 ? "good" : "bad";
}

function toneClass(tone: "good" | "bad" | "muted") {
  if (tone === "good") return "text-primary";
  if (tone === "bad") return "text-destructive";
  return "text-muted-foreground";
}
