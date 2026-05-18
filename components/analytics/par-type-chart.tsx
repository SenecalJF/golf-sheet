"use client";

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import type { ParTypeStat } from "@/lib/stats";

export function ParTypeChart({ stats }: { stats: ParTypeStat[] }) {
  if (stats.every((s) => s.holes === 0)) {
    return (
      <div className="grid h-64 place-items-center text-sm text-muted-foreground">
        No hole data yet.
      </div>
    );
  }
  const data = stats.map((s) => ({
    name: `Par ${s.parType}`,
    avg: s.avg,
    avgVsPar: s.avgVsPar,
    holes: s.holes,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Bar dataKey="avgVsPar" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
