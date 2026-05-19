"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  ChevronRight,
  ImagePlus,
  PenLine,
  Save,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
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
import { resizeImage } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

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

type DetectedTee = {
  name: string | null;
  color: string | null;
  rating: number | null;
  slope: number | null;
  yardage: number | null;
};

type SelectedFile = {
  file: File;
  previewUrl: string;
};

const MAX_FILES = 6;

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
  const [sourceImages, setSourceImages] = React.useState<string[]>([]);
  const [extracting, setExtracting] = React.useState(false);
  const [extractionModel, setExtractionModel] = React.useState<string | null>(null);
  const [extractionNotes, setExtractionNotes] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<SelectedFile[]>([]);
  const [detectedTees, setDetectedTees] = React.useState<DetectedTee[]>([]);
  const [chosenDetectedTeeName, setChosenDetectedTeeName] = React.useState<string | null>(
    null,
  );
  const filesRef = React.useRef<SelectedFile[]>([]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedTee = selectedCourse?.tees.find((t) => t.id === teeId);

  const chosenDetectedTee =
    detectedTees.find(
      (t) => (t.name ?? "").toLowerCase() === (chosenDetectedTeeName ?? "").toLowerCase(),
    ) ?? null;

  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  React.useEffect(() => {
    return () => {
      for (const item of filesRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  function updateCourseId(nextCourseId: string) {
    setCourseId(nextCourseId);
    setTeeId("");
  }

  function updateTeeId(nextTeeId: string) {
    setTeeId(nextTeeId);
    const tee = selectedCourse?.tees.find((t) => t.id === nextTeeId);
    if (tee) {
      setHoles((prev) => applyTeePars(prev, tee.pars, holeCount, nineType));
    }
  }

  function updateHoleCount(nextHoleCount: 9 | 18) {
    const nextNineType = nextHoleCount === 18 ? null : nineType;
    setHoleCount(nextHoleCount);
    if (nextHoleCount === 18) setNineType(null);
    setHoles((prev) =>
      applyTeePars(
        prev.length === nextHoleCount ? prev : buildBlankHoles(nextHoleCount, prev),
        selectedTee?.pars,
        nextHoleCount,
        nextNineType,
      ),
    );
  }

  function updateNineType(nextNineType: "front" | "back" | null) {
    setNineType(nextNineType);
    setHoles((prev) => applyTeePars(prev, selectedTee?.pars, holeCount, nextNineType));
  }

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const incoming = Array.from(picked).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) {
      toast.error("Pick image files only");
      return;
    }
    const selected = incoming.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    const capacity = Math.max(0, MAX_FILES - files.length);
    const nextFiles = selected.slice(0, capacity);
    for (const item of selected.slice(capacity)) URL.revokeObjectURL(item.previewUrl);
    if (selected.length > capacity) {
      toast.warning(`Keeping the first ${MAX_FILES} photos`);
    }
    setFiles((prev) => [...prev, ...nextFiles]);
  }

  function removeFile(idx: number) {
    const removed = files[idx];
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function extractAi() {
    if (files.length === 0) {
      toast.error("Pick at least one photo first");
      return;
    }
    setExtracting(true);
    try {
      const resized = await Promise.all(files.map((item) => resizeImage(item.file)));
      const form = new FormData();
      for (const f of resized) form.append("files", f);
      if (selectedTee) form.append("expectedPars", selectedTee.pars);
      form.append("preferredHoleCount", String(holeCount));
      const res = await fetch("/api/extract-scorecard", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Extraction failed");
      }
      const data = (await res.json()) as {
        extraction: ExtractedScorecard;
        imagePaths: string[];
        model: string;
      };
      setSourceImages(data.imagePaths ?? []);
      setExtractionModel(data.model);
      setExtractionNotes(data.extraction.notes ?? null);
      setHoleCount(data.extraction.holeCount);
      setNineType(data.extraction.nineType ?? null);

      const tees: DetectedTee[] = (data.extraction.tees ?? []).map((t) => ({
        name: t.name ?? null,
        color: t.color ?? null,
        rating: t.rating ?? null,
        slope: t.slope ?? null,
        yardage: t.yardage ?? null,
      }));
      setDetectedTees(tees);

      const aiPlayerTee = data.extraction.playerTeeName?.trim() || null;
      let initialPick: string | null = null;
      if (aiPlayerTee && tees.some((t) => (t.name ?? "") === aiPlayerTee)) {
        initialPick = aiPlayerTee;
      } else if (tees.length === 1 && tees[0].name) {
        initialPick = tees[0].name;
      }
      setChosenDetectedTeeName(initialPick);

      // Apply hole scores using extracted pars (or the detected per-hole par)
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

      toast.success(
        tees.length > 0
          ? `Extracted scorecard + ${tees.length} tee${tees.length === 1 ? "" : "s"}`
          : "Extracted scorecard — please review",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setExtracting(false);
    }
  }

  async function ensureTeeForChosen(): Promise<string | null> {
    if (!selectedCourse) return null;

    // No AI detection available — fall back to dropdown selection
    if (!chosenDetectedTee) return teeId || null;

    const detectedName = chosenDetectedTee.name?.trim();
    if (!detectedName) return teeId || null;

    // Match against existing course tees by case-insensitive name
    const existing = selectedCourse.tees.find(
      (t) => t.name.trim().toLowerCase() === detectedName.toLowerCase(),
    );

    const parsString = holes.map((h) => h.par).join(",");

    if (existing) {
      // Update with newly detected stats (only fields we have)
      const res = await fetch(`/api/courses/${selectedCourse.id}/tees`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teeId: existing.id,
          name: existing.name,
          color: chosenDetectedTee.color ?? null,
          rating: chosenDetectedTee.rating ?? null,
          slope: chosenDetectedTee.slope ?? null,
          yardage: chosenDetectedTee.yardage ?? null,
          pars: parsString,
          holeCount: holeCount === 9 ? 18 : holeCount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Failed to update tee");
      }
      return existing.id;
    }

    // Create a new tee for this course with the detected stats
    const res = await fetch(`/api/courses/${selectedCourse.id}/tees`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: detectedName,
        color: chosenDetectedTee.color ?? null,
        rating: chosenDetectedTee.rating ?? null,
        slope: chosenDetectedTee.slope ?? null,
        yardage: chosenDetectedTee.yardage ?? null,
        pars: parsString,
        holeCount: holeCount === 9 ? 18 : holeCount,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.error === "string" ? err.error : "Failed to create tee");
    }
    const created = (await res.json()) as { id: string };
    return created.id;
  }

  async function saveRound() {
    if (!courseId) return toast.error("Choose a course");
    if (holes.some((h) => h.strokes == null || h.illegible)) {
      return toast.error("Fill in every hole before saving");
    }
    setSubmitting(true);
    try {
      const finalTeeId = await ensureTeeForChosen();

      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          teeId: finalTeeId,
          date,
          holeCount,
          nineType: holeCount === 9 ? nineType : null,
          notes: notes || null,
          pcc: 0,
          sourceImage: sourceImages[0] ?? null,
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
        const err = await res.json().catch(() => ({}));
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

  const needsTee =
    mode === "ai" ? !chosenDetectedTee && !teeId && (selectedCourse?.tees.length ?? 0) > 0 : false;

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
                  Take up to {MAX_FILES} pictures of your scorecard — wide shot, front 9,
                  back 9, rating box. Claude reads it all and shows you each tee so you can
                  pick the one you played.
                </p>
                {!aiEnabled && (
                  <Badge variant="outline" className="mt-3 border-amber-500/40 text-amber-400">
                    Add your Claude key in Settings
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
            setCourseId={updateCourseId}
            teeId={teeId}
            setTeeId={updateTeeId}
            date={date}
            setDate={setDate}
            holeCount={holeCount}
            setHoleCount={updateHoleCount}
            nineType={nineType}
            setNineType={updateNineType}
            hideTeeDropdown={mode === "ai" && detectedTees.length > 0}
          />

          {mode === "ai" && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4 text-primary" /> Scorecard photos
                <span className="ml-1 text-xs text-muted-foreground">
                  ({files.length}/{MAX_FILES})
                </span>
              </div>

              <FilePicker files={files} onAdd={addFiles} onRemove={removeFile} />

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={extractAi} disabled={files.length === 0 || extracting}>
                  <UploadCloud className="mr-1 h-4 w-4" />
                  {extracting ? "Reading..." : "Read with AI"}
                </Button>
                {extractionModel && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Read by {extractionModel}
                  </Badge>
                )}
                {extractionNotes && (
                  <p className="basis-full text-xs text-muted-foreground">
                    AI notes: {extractionNotes}
                  </p>
                )}
              </div>

              {detectedTees.length > 0 && (
                <DetectedTeesPicker
                  tees={detectedTees}
                  chosen={chosenDetectedTeeName}
                  onChoose={setChosenDetectedTeeName}
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
            <Button onClick={saveRound} disabled={submitting || !courseId || needsTee}>
              <Save className="mr-1 h-4 w-4" /> {submitting ? "Saving..." : "Save round"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {needsTee && (
            <p className="text-right text-xs text-muted-foreground">
              Pick a tee above before saving.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function FilePicker({
  files,
  onAdd,
  onRemove,
}: {
  files: SelectedFile[];
  onAdd: (f: FileList | null) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canAdd = files.length < MAX_FILES;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {files.map((item, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-lg border border-border/60 bg-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="aspect-[3/4] w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-background/80 text-foreground opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white">
              {item.file.name}
            </div>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-card/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">{files.length === 0 ? "Add photos" : "Add more"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          if (e.target) e.target.value = "";
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        Tip: wide shot of the whole card + close-ups of any messy sections + the
        rating/slope box. Up to {MAX_FILES} photos.
      </p>
    </div>
  );
}

function DetectedTeesPicker({
  tees,
  chosen,
  onChoose,
}: {
  tees: DetectedTee[];
  chosen: string | null;
  onChoose: (name: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        Pick the tee you played from
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tees.map((t, i) => {
          const name = t.name ?? `Tee ${i + 1}`;
          const isChosen = chosen?.toLowerCase() === (t.name ?? "").toLowerCase();
          return (
            <button
              key={`${name}-${i}`}
              type="button"
              onClick={() => onChoose(t.name ?? name)}
              className={cn(
                "group flex items-start gap-3 rounded-xl border bg-card/60 p-3 text-left transition-colors",
                isChosen
                  ? "border-primary/60 ring-2 ring-primary/40"
                  : "border-border/60 hover:border-primary/40",
              )}
            >
              <span
                className="mt-0.5 inline-block h-6 w-6 shrink-0 rounded-full border border-border/60"
                style={{ background: t.color ?? "var(--secondary)" }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-sm font-semibold tracking-tight">{name}</div>
                  {isChosen && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                      Playing
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {t.rating != null && <span>Rating {t.rating}</span>}
                  {t.slope != null && <span>Slope {t.slope}</span>}
                  {t.yardage != null && <span>{t.yardage} yd</span>}
                  {t.rating == null && t.slope == null && t.yardage == null && (
                    <span className="italic">No stats on card</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
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
  hideTeeDropdown?: boolean;
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

      {!props.hideTeeDropdown && (
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
      )}

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
        <Input
          type="date"
          value={props.date}
          onChange={(e) => props.setDate(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className={props.hideTeeDropdown ? "md:col-span-2" : "md:col-span-2"}>
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
