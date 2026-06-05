"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreTrendFormatPanel } from "@/components/dashboard/score-trend-format-panel";
import type { TrendPoint } from "@/lib/stats";

export function DashboardTrendCard({
  eighteenHoleTrend,
  nineHoleTrend,
  handicap,
}: {
  eighteenHoleTrend: TrendPoint[];
  nineHoleTrend: TrendPoint[];
  handicap: number | null;
}) {
  return (
    <Card className="p-6">
      <ScoreTrendFormatPanel
        eighteenHoleTrend={eighteenHoleTrend}
        nineHoleTrend={nineHoleTrend}
        handicap={handicap}
        actions={
          <Button asChild variant="ghost" size="sm" className="h-10">
            <Link href="/analytics">
              Open analytics <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />
    </Card>
  );
}
