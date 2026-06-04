"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HoleScoreGrid, type GridHole } from "@/components/rounds/hole-score-grid";
import { ExcludeFromStatsToggle } from "@/components/rounds/exclude-from-stats-toggle";
import { parsePars } from "@/lib/types";

type CourseWithTees = {
  id: string;
  name: string;
  city: string;
  tees: {
    id: string;
    name: string;
    pars: string;
    holeCount: number;
    rating: number | null;
    slope: number | null;
  }[];
};

export type EditableRound = {
  id: string;
  courseId: string;
  teeId: string | null;
  date: string;
  holeCount: 9 | 18;
  nineType: "front" | "back" | null;
  notes: string | null;
  weather: string | null;
  pcc: number;
  sourceImage: string | null;
  extractionModel: string | null;
  excludeFromStats: boolean;
  holes: GridHole[];
};

const NO_TEE = "__no_tee__";

export function RoundEditForm({
  round,
  courses,
}: {
  round: EditableRound;
  courses: CourseWithTees[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState(round.courseId);
  const [teeId, setTeeId] = React.useState(round.teeId ?? "");
  const [date, setDate] = React.useState(round.date);
  const [holeCount, setHoleCount] = React.useState<9 | 18>(round.holeCount);
  const [nineType, setNineType] = React.useState<"front" | "back" | null>(
    round.nineType,
  );
  const [holes, setHoles] = React.useState<GridHole[]>(round.holes);
  const [notes, setNotes] = React.useState(round.notes ?? "");
  const [excludeFromStats, setExcludeFromStats] = React.useState(round.excludeFromStats);
  const [submitting, setSubmitting] = React.useState(false);

  const selectedCourse = courses.find((course) => course.id === courseId);
  const selectedTee = selectedCourse?.tees.find((tee) => tee.id === teeId);
  const completedHoles = holes.filter((hole) => hole.strokes != null && !hole.illegible).length;
  const hasIncompleteHoles = completedHoles !== holeCount;
  const totalStrokes = holes.reduce((sum, hole) => sum + (hole.strokes ?? 0), 0);
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const saveDisabled = submitting || !courseId || !date || hasIncompleteHoles;
  const courseOrTeeChanged = courseId !== round.courseId || teeId !== (round.teeId ?? "");

  function updateCourseId(nextCourseId: string) {
    setCourseId(nextCourseId);
    setTeeId("");
  }

  function updateTeeId(nextTeeId: string) {
    const normalized = nextTeeId === NO_TEE ? "" : nextTeeId;
    setTeeId(normalized);
    const tee = selectedCourse?.tees.find((item) => item.id === normalized);
    if (tee) {
      setHoles((prev) => applyTeePars(prev, tee.pars, holeCount, nineType));
    }
  }

  function updateHoleCount(nextHoleCount: 9 | 18) {
    const nextNineType = nextHoleCount === 18 ? null : nineType ?? "front";
    setHoleCount(nextHoleCount);
    setNineType(nextNineType);
    setHoles((prev) =>
      applyTeePars(
        prev.length === nextHoleCount ? prev : buildBlankHoles(nextHoleCount, prev),
        selectedTee?.pars,
        nextHoleCount,
        nextNineType,
      ),
    );
  }

  function updateNineType(nextNineType: "front" | "back") {
    setNineType(nextNineType);
    setHoles((prev) => applyTeePars(prev, selectedTee?.pars, holeCount, nextNineType));
  }

  async function saveRound() {
    if (!courseId) return toast.error("Choose a course");
    if (holes.some((hole) => hole.strokes == null || hole.illegible)) {
      return toast.error("Fill in every hole before saving");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rounds/${round.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          teeId: teeId || null,
          date,
          holeCount,
          nineType: holeCount === 9 ? nineType : null,
          notes: notes.trim() || null,
          weather: round.weather,
          pcc: round.pcc,
          sourceImage: round.sourceImage,
          extractionModel: round.extractionModel,
          excludeFromStats,
          holes: holes.map((hole) => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
            strokes: hole.strokes as number,
            putts: hole.putts ?? null,
            confidence: hole.confidence ?? null,
            illegible: false,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      toast.success("Round updated");
      router.push(`/rounds/${round.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-0">
      <Card className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Course
            </Label>
            <Select
              value={courseId}
              onValueChange={(value) => updateCourseId(value ?? "")}
              items={courses.map((course) => ({
                label: `${course.name} - ${course.city}`,
                value: course.id,
              }))}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} - {course.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tee</Label>
            <Select
              value={teeId || NO_TEE}
              onValueChange={(value) => updateTeeId(value ?? NO_TEE)}
              disabled={!selectedCourse}
              items={[
                { label: "No tee selected", value: NO_TEE },
                ...(selectedCourse?.tees ?? []).map((tee) => ({
                  label: `${tee.name}${tee.slope ? ` - slope ${tee.slope}` : " - no slope yet"}`,
                  value: tee.id,
                })),
              ]}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pick a tee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TEE}>No tee selected</SelectItem>
                {selectedCourse?.tees.map((tee) => (
                  <SelectItem key={tee.id} value={tee.id}>
                    {tee.name}
                    {tee.slope ? ` - slope ${tee.slope}` : " - no slope yet"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Format</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[18, 9].map((count) => (
                <Button
                  key={count}
                  type="button"
                  size="sm"
                  variant={holeCount === (count as 9 | 18) ? "default" : "outline"}
                  onClick={() => updateHoleCount(count as 9 | 18)}
                >
                  {count} holes
                </Button>
              ))}
              {holeCount === 9 && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant={nineType === "front" ? "default" : "outline"}
                    onClick={() => updateNineType("front")}
                  >
                    Front 9
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={nineType === "back" ? "default" : "outline"}
                    onClick={() => updateNineType("back")}
                  >
                    Back 9
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {courseOrTeeChanged && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              Changing course or tee can update pars, rating, slope, score differential, and
              handicap-related stats.
            </div>
          </div>
        )}

        {!teeId && (
          <div className="w-fit max-w-full rounded-lg border border-amber-500/40 px-3 py-2 text-sm text-amber-400">
            No tee selected: differential will be unavailable.
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Hole scores
          </Label>
          <HoleScoreGrid holes={holes} onChange={setHoles} showConfidence={false} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Notes
          </Label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Weather, playing partners, anything memorable"
            maxLength={500}
            rows={3}
          />
        </div>

        <ExcludeFromStatsToggle value={excludeFromStats} onChange={setExcludeFromStats} />

        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link href={`/rounds/${round.id}`}>Cancel</Link>
          </Button>
          <Button onClick={saveRound} disabled={saveDisabled} className="hidden lg:inline-flex">
            <Save className="mr-1 h-4 w-4" />
            {submitting ? "Saving..." : "Save changes"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {completedHoles}/{holeCount} holes
            </div>
            <div className="number-mono truncate text-lg font-semibold">
              {totalStrokes || "-"}{" "}
              <span className="text-xs font-normal text-muted-foreground">par {totalPar}</span>
            </div>
          </div>
          <Button className="h-11 px-4" onClick={saveRound} disabled={saveDisabled}>
            <Save className="mr-1 h-4 w-4" />
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildBlankHoles(count: 9 | 18, previous?: GridHole[]): GridHole[] {
  return Array.from({ length: count }, (_, index) => ({
    holeNumber: index + 1,
    par: previous?.[index]?.par ?? 4,
    strokes: previous?.[index]?.strokes ?? null,
    putts: previous?.[index]?.putts ?? null,
    confidence: previous?.[index]?.confidence ?? null,
    illegible: previous?.[index]?.illegible ?? false,
  }));
}

function applyTeePars(
  holes: GridHole[],
  parsString: string | undefined,
  holeCount: 9 | 18,
  nineType: "front" | "back" | null,
): GridHole[] {
  if (!parsString) return holes;
  const pars = parsePars(parsString);
  if (pars.length === holeCount) {
    return holes.map((hole, index) => ({ ...hole, par: pars[index] ?? hole.par }));
  }
  if (holeCount === 9 && pars.length === 18) {
    const slice = nineType === "back" ? pars.slice(9) : pars.slice(0, 9);
    return holes.map((hole, index) => ({ ...hole, par: slice[index] ?? hole.par }));
  }
  return holes;
}
