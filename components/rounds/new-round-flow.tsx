"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, ChevronRight, PenLine, Save, Sparkles, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HoleScoreGrid, type GridHole } from "@/components/rounds/hole-score-grid";
import { parsePars } from "@/lib/types";
import type { ExtractedScorecard } from "@/lib/types";

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

export function NewRoundFlow({
  courses,
  aiEnabled,
}: {
  courses: CourseWithTees[];
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"choose" | "ai" | "manual">("choose");
  const [courseId, setCourseId] = React.useState<string>("");
  const [teeId, setTeeId] = React.useState<string>("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [holeCount, setHoleCount] = React.useState<9 | 18>(18);
  const [nineType, setNineType] = React.useState<"front" | "back" | null>(null);
  const [holes, setHoles] = React.useState<GridHole[]>(buildBlankHoles(18));
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sourceImage, setSourceImage] = React.useState<string | null>(null);
  const [extracting, setExtracting] = React.useState(false);
  const [extractionModel, setExtractionModel] = React.useState<string | null>(null);
  const [extractionNotes, setExtractionNotes] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedTee, setExtractedTee] = React.useState<{
    name: string | null;
    rating: number | null;
    slope: number | null;
    yardage: number | null;
  } | null>(null);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedTee = selectedCourse?.tees.find((t) => t.id === teeId);
  const teeNeedsRating = selectedTee && (selectedTee.rating == null || selectedTee.slope == null);
  const canPatchTee =
    teeNeedsRating &&
    extractedTee &&
    (extractedTee.rating != null || extractedTee.slope != null);

  React.useEffect(() => {
    if (!selectedTee) return;
    const pars = parsePars(selectedTee.pars);
    if (pars.length === holeCount) {
      setHoles((prev) =>
        prev.map((h, i) => ({ ...h, par: pars[i] ?? h.par })),
      );
    } else if (holeCount === 9 && pars.length === 18) {
      const slice = nineType === "back" ? pars.slice(9) : pars.slice(0, 9);
      setHoles((prev) =>
        prev.map((h, i) => ({ ...h, par: slice[i] ?? h.par })),
      );
    }
  }, [selectedTee, holeCount, nineType]);

  React.useEffect(() => {
    setHoles((prev) => {
      if (prev.length === holeCount) return prev;
      return buildBlankHoles(holeCount, prev);
    });
  }, [holeCount]);

  async function extractAi() {
    if (!file) {
      toast.error("Choose an image first");
      return;
    }
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedTee) form.append("expectedPars", selectedTee.pars);
      form.append("preferredHoleCount", String(holeCount));
      const res = await fetch("/api/extract-scorecard", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Extraction failed");
      }
      const data = (await res.json()) as {
        extraction: ExtractedScorecard;
        imagePath: string;
        model: string;
      };
      setSourceImage(data.imagePath);
      setExtractionModel(data.model);
      setExtractionNotes(data.extraction.notes ?? null);
      setHoleCount(data.extraction.holeCount);
      setNineType(data.extraction.nineType ?? null);
      setExtractedTee(
        data.extraction.tee
          ? {
              name: data.extraction.tee.name ?? null,
              rating: data.extraction.tee.rating ?? null,
              slope: data.extraction.tee.slope ?? null,
              yardage: data.extraction.tee.yardage ?? null,
            }
          : null,
      );

      const extractedPars = data.extraction.pars ?? null;
      const fallbackPars = selectedTee ? parsePars(selectedTee.pars) : [];
      const extracted: GridHole[] = data.extraction.holes.map((h, i) => ({
        holeNumber: h.hole ?? i + 1,
        par: h.par ?? extractedPars?.[i] ?? fallbackPars[i] ?? 4,
        strokes: h.strokes,
        confidence: h.confidence ?? null,
        illegible: h.illegible,
      }));
      setHoles(extracted);
      toast.success("Scorecard extracted — please review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setExtracting(false);
    }
  }

  async function applyExtractedTee() {
    if (!selectedTee || !courseId || !extractedTee) return;
    try {
      const newPars = holes.map((h) => h.par).join(",");
      const res = await fetch(`/api/courses/${courseId}/tees`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teeId: selectedTee.id,
          rating: extractedTee.rating ?? selectedTee.rating ?? null,
          slope: extractedTee.slope ?? selectedTee.slope ?? null,
          yardage: extractedTee.yardage ?? null,
          pars: newPars,
          holeCount: selectedTee.holeCount,
          name: selectedTee.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Failed");
      }
      toast.success("Tee details saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function saveRound() {
    if (!courseId) return toast.error("Choose a course");
    if (holes.some((h) => h.strokes == null || h.illegible)) {
      return toast.error("Fill in every hole before saving");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          teeId: teeId || null,
          date,
          holeCount,
          nineType: holeCount === 9 ? nineType : null,
          notes: notes || null,
          pcc: 0,
          sourceImage,
          extractionModel,
          holes: holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokes: h.strokes as number,
            putts: h.putts ?? null,
            confidence: h.confidence ?? null,
            illegible: false,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      const round = await res.json();
      toast.success("Round saved");
      router.push(`/rounds/${round.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">New round</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Log a scorecard</h1>
        </div>
      </div>

      {mode === "choose" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => setMode("ai")}
            className="group text-left"
            disabled={!aiEnabled}
          >
            <Card
              className={
                "relative h-full overflow-hidden p-6 transition-colors " +
                (aiEnabled
                  ? "group-hover:border-primary/40"
                  : "opacity-60 cursor-not-allowed")
              }
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">Photo + AI</h2>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Take a picture of your scorecard. Claude will read every hole and you
                  confirm before saving. Best for messy handwriting.
                </p>
                {!aiEnabled && (
                  <Badge variant="outline" className="mt-3 border-amber-500/40 text-amber-400">
                    ANTHROPIC_API_KEY missing — set it in .env.local
                  </Badge>
                )}
              </div>
            </Card>
          </button>

          <button onClick={() => setMode("manual")} className="group text-left">
            <Card className="h-full p-6 transition-colors group-hover:border-primary/40">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
                  <PenLine className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Manual entry</h2>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Type in your scores directly. Fast if you already have the numbers handy.
              </p>
            </Card>
          </button>
        </div>
      )}

      {mode !== "choose" && (
        <Card className="space-y-6 p-6">
          <CourseDateBlock
            courses={courses}
            courseId={courseId}
            setCourseId={setCourseId}
            teeId={teeId}
            setTeeId={setTeeId}
            date={date}
            setDate={setDate}
            holeCount={holeCount}
            setHoleCount={setHoleCount}
            nineType={nineType}
            setNineType={setNineType}
          />

          {mode === "ai" && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4 text-primary" /> Upload scorecard photo
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-2">
                <Button onClick={extractAi} disabled={!file || extracting}>
                  <UploadCloud className="mr-1 h-4 w-4" />
                  {extracting ? "Extracting..." : "Extract with AI"}
                </Button>
                {extractionModel && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Read by {extractionModel}
                  </Badge>
                )}
              </div>
              {extractionNotes && (
                <p className="text-xs text-muted-foreground">AI notes: {extractionNotes}</p>
              )}
              {extractedTee && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                  <div className="mb-1 font-medium text-primary">
                    AI read off the card:
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    {extractedTee.name && <span>Tee: {extractedTee.name}</span>}
                    {extractedTee.rating != null && (
                      <span>Rating: {extractedTee.rating}</span>
                    )}
                    {extractedTee.slope != null && <span>Slope: {extractedTee.slope}</span>}
                    {extractedTee.yardage != null && (
                      <span>Yardage: {extractedTee.yardage}</span>
                    )}
                  </div>
                  {canPatchTee && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={applyExtractedTee}
                    >
                      Save to this tee
                    </Button>
                  )}
                </div>
              )}
              {sourceImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={sourceImage}
                  alt="Uploaded scorecard"
                  className="max-h-80 rounded-lg border border-border/60 object-contain"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Hole scores
            </Label>
            <HoleScoreGrid holes={holes} onChange={setHoles} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weather, playing partners, anything memorable"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setMode("choose")}>
              Back
            </Button>
            <Button onClick={saveRound} disabled={submitting || !courseId}>
              <Save className="mr-1 h-4 w-4" /> {submitting ? "Saving..." : "Save round"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function CourseDateBlock(props: {
  courses: CourseWithTees[];
  courseId: string;
  setCourseId: (v: string) => void;
  teeId: string;
  setTeeId: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  holeCount: 9 | 18;
  setHoleCount: (v: 9 | 18) => void;
  nineType: "front" | "back" | null;
  setNineType: (v: "front" | "back" | null) => void;
}) {
  const course = props.courses.find((c) => c.id === props.courseId);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Course</Label>
        <Select
          value={props.courseId}
          onValueChange={(v) => props.setCourseId(v ?? "")}
          items={props.courses.map((c) => ({
            label: `${c.name} — ${c.city}`,
            value: c.id,
          }))}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Choose a course..." />
          </SelectTrigger>
          <SelectContent>
            {props.courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tee</Label>
        <Select
          value={props.teeId}
          onValueChange={(v) => props.setTeeId(v ?? "")}
          disabled={!course}
          items={(course?.tees ?? []).map((t) => ({
            label: `${t.name}${t.slope ? ` · slope ${t.slope}` : " · no slope yet"}`,
            value: t.id,
          }))}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Pick a tee" />
          </SelectTrigger>
          <SelectContent>
            {course?.tees.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
                {t.slope ? ` · slope ${t.slope}` : " · no slope yet"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
        <Input
          type="date"
          value={props.date}
          onChange={(e) => props.setDate(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Format</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {[18, 9].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={props.holeCount === (n as 9 | 18) ? "default" : "outline"}
              onClick={() => props.setHoleCount(n as 9 | 18)}
            >
              {n} holes
            </Button>
          ))}
          {props.holeCount === 9 && (
            <>
              <Button
                size="sm"
                variant={props.nineType === "front" ? "default" : "outline"}
                onClick={() => props.setNineType("front")}
              >
                Front 9
              </Button>
              <Button
                size="sm"
                variant={props.nineType === "back" ? "default" : "outline"}
                onClick={() => props.setNineType("back")}
              >
                Back 9
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildBlankHoles(n: 9 | 18, previous?: GridHole[]): GridHole[] {
  return Array.from({ length: n }, (_, i) => ({
    holeNumber: i + 1,
    par: previous?.[i]?.par ?? 4,
    strokes: previous?.[i]?.strokes ?? null,
    putts: previous?.[i]?.putts ?? null,
  }));
}
