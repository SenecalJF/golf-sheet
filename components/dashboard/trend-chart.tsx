"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { TrendPoint } from "@/lib/stats";
import { format, parseISO } from "date-fns";

export function TrendChart({
  trend,
  handicap,
  emptyMessage = "Play your first round to see a trend.",
}: {
  trend: TrendPoint[];
  handicap: number | null;
  emptyMessage?: string;
}) {
  if (trend.length === 0) {
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v) => format(parseISO(v), "MMM d")}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            stroke="var(--border)"
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={((value: unknown, _name: unknown, item: { payload: TrendPoint }) => {
              const p = item.payload;
              return [`${value} (${p.overPar >= 0 ? "+" : ""}${p.overPar})`, p.course];
            }) as never}
            labelFormatter={(v) => format(parseISO(v as string), "EEE, MMM d, yyyy")}
          />
          {handicap != null && (
            <ReferenceLine
              y={handicap}
              stroke="var(--primary)"
              strokeDasharray="4 4"
              label={{
                value: `HI ${handicap.toFixed(1)}`,
                fill: "var(--primary)",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="totalStrokes"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
