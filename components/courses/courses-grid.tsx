"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Info, MapPin, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export type CourseCardData = {
  id: string;
  name: string;
  city: string;
  province: string;
  userRounds: number;
  totalRounds: number;
  tees: { rating: number | null; slope: number | null }[];
};

export function CoursesGrid({ courses }: { courses: CourseCardData[] }) {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? courses.filter(
        (c) =>
          c.name.toLowerCase().includes(normalized) ||
          c.city.toLowerCase().includes(normalized),
      )
    : courses;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search course or city..."
          className="h-10 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            No course matches “{query}”.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const tee = c.tees[0];
            const needsSetup = !tee || tee.rating == null || tee.slope == null;
            return (
              <Link key={c.id} href={`/courses/${c.id}`} className="group">
                <Card className="h-full p-5 transition-colors group-hover:border-primary/40">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Flag className="h-5 w-5" />
                    </div>
                    {needsSetup ? (
                      <Badge
                        variant="outline"
                        className="border-border/60 text-muted-foreground"
                      >
                        <Info className="mr-1 h-3 w-3" /> No rating yet
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Handicap-ready
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight group-hover:text-primary">
                    {c.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.city}, {c.province}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      You: {c.userRounds} round{c.userRounds === 1 ? "" : "s"}
                    </span>
                    <span className={c.totalRounds === 0 ? "opacity-50" : undefined}>
                      All players: {c.totalRounds}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
