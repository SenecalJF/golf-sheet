"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  ChevronRight,
  ImagePlus,
  PenLine,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
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

type ShareableUser = {
  id: string;
  name: string;
  image: string | null;
};

type DetectedPlayer = {
  playerName: string | null;
  rowLabel: string | null;
  holes: GridHole[];
  confidence: number | null;
  notes: string | null;
};

type PendingAssignment = {
  playerIndex: number;
  recipientUserId: string;
};

type SelectedFile = {
  file: File;
  previewUrl: string;
};

type RoundDraft = {
  version: 1;
  savedAt: string;
  mode: "ai" | "manual";
  courseId: string;
  teeId: string;
  date: string;
  holeCount: 9 | 18;
  nineType: "front" | "back" | null;
  holes: GridHole[];
  notes: string;
  sourceImages: string[];
  extractionModel: string | null;
  extractionNotes: string | null;
  detectedTees: DetectedTee[];
  chosenDetectedTeeName: string | null;
  detectedPlayers: DetectedPlayer[];
  selectedPlayerIndex: number | null;
  pendingAssignments: PendingAssignment[];
};

type RoundDraftInput = Omit<RoundDraft, "version" | "savedAt" | "mode"> & {
  mode: "choose" | "ai" | "manual";
};

const MAX_FILES = 6;
const DRAFT_KEY = "golf-sheet:new-round-draft:v1";
const DRAFT_EVENT = "golf-sheet-new-round-draft";

export function NewRoundFlow({
  courses,
  aiEnabled,
  shareableUsers,
}: {
  courses: CourseWithTees[];
  aiEnabled: boolean;
  shareableUsers: ShareableUser[];
}) {
  const router = useRouter();
  const draftSnapshot = React.useSyncExternalStore(
    subscribeToDraft,
    readDraftSnapshot,
    emptyDraftSnapshot,
  );
  const savedDraft = React.useMemo(() => parseRoundDraft(draftSnapshot), [draftSnapshot]);
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
  const [detectedPlayers, setDetectedPlayers] = React.useState<DetectedPlayer[]>([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = React.useState<number | null>(null);
  const [pendingAssignments, setPendingAssignments] = React.useState<PendingAssignment[]>([]);
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

  React.useEffect(() => {
    const draft = buildRoundDraft({
      mode,
      courseId,
      teeId,
      date,
      holeCount,
      nineType,
      holes,
      notes,
      sourceImages,
      extractionModel,
      extractionNotes,
      detectedTees,
      chosenDetectedTeeName,
      detectedPlayers,
      selectedPlayerIndex,
      pendingAssignments,
    });
    if (draft) writeRoundDraft(draft);
  }, [
    chosenDetectedTeeName,
    courseId,
    date,
    detectedTees,
    detectedPlayers,
    extractionModel,
    extractionNotes,
    holeCount,
    holes,
    mode,
    nineType,
    notes,
    pendingAssignments,
    selectedPlayerIndex,
    sourceImages,
    teeId,
  ]);

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

      const extractedPars = data.extraction.pars ?? null;
      const fallbackPars = selectedTee ? parsePars(selectedTee.pars) : [];
      const sourcePlayers =
        data.extraction.players.length > 0
          ? data.extraction.players
          : data.extraction.holes
            ? [
                {
                  playerName: null,
                  rowLabel: "Player 1",
                  holes: data.extraction.holes,
                  confidence: 0.8,
                  notes: null,
                },
              ]
            : [];
      const players: DetectedPlayer[] = sourcePlayers.map((player, playerIndex) => ({
        playerName: player.playerName ?? null,
        rowLabel: player.rowLabel ?? `Player ${playerIndex + 1}`,
        holes: player.holes.map((h, i) => ({
          holeNumber: h.hole ?? i + 1,
          par: h.par ?? extractedPars?.[i] ?? fallbackPars[i] ?? 4,
          strokes: h.strokes,
          confidence: h.confidence ?? null,
          illegible: h.illegible,
        })),
        confidence: player.confidence ?? null,
        notes: player.notes ?? null,
      }));
      setDetectedPlayers(players);
      setPendingAssignments([]);
      if (players.length === 1) {
        setSelectedPlayerIndex(0);
        setHoles(players[0].holes);
      } else if (players.length > 1) {
        setSelectedPlayerIndex(null);
        setHoles(
          applyTeePars(
            buildBlankHoles(data.extraction.holeCount),
            selectedTee?.pars,
            data.extraction.holeCount,
            data.extraction.nineType ?? null,
          ),
        );
      }

      toast.success(
        players.length > 1
          ? `Found ${players.length} player rows — choose yours`
          : tees.length > 0
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
    if (mode === "ai" && detectedPlayers.length > 1 && selectedPlayerIndex == null) {
      return toast.error("Choose your player row before saving");
    }
    if (holes.some((h) => h.strokes == null || h.illegible)) {
      return toast.error("Fill in every hole before saving");
    }
    if (hasIncompleteAssignments) {
      return toast.error("Assigned player rows need complete scores");
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
          pendingAssignments: buildPendingRoundAssignments(
            detectedPlayers,
            pendingAssignments,
          ),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      const round = await res.json();
      clearRoundDraft();
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
  const completedHoles = holes.filter((h) => h.strokes != null && !h.illegible).length;
  const hasIncompleteHoles = completedHoles !== holeCount;
  const hasIncompleteAssignments = pendingAssignments.some((assignment) => {
    const player = detectedPlayers[assignment.playerIndex];
    return !player || player.holes.some((hole) => hole.strokes == null || hole.illegible);
  });
  const totalStrokes = holes.reduce((sum, h) => sum + (h.strokes ?? 0), 0);
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const needsPlayerRow = mode === "ai" && detectedPlayers.length > 1 && selectedPlayerIndex == null;
  const saveDisabled =
    submitting ||
    !courseId ||
    needsTee ||
    needsPlayerRow ||
    hasIncompleteHoles ||
    hasIncompleteAssignments;

  function restoreDraft(draft: RoundDraft) {
    setMode(draft.mode);
    setCourseId(draft.courseId);
    setTeeId(draft.teeId);
    setDate(draft.date);
    setHoleCount(draft.holeCount);
    setNineType(draft.nineType);
    setHoles(draft.holes);
    setNotes(draft.notes);
    setSourceImages(draft.sourceImages);
    setExtractionModel(draft.extractionModel);
    setExtractionNotes(draft.extractionNotes);
    setDetectedTees(draft.detectedTees);
    setChosenDetectedTeeName(draft.chosenDetectedTeeName);
    setDetectedPlayers(draft.detectedPlayers);
    setSelectedPlayerIndex(draft.selectedPlayerIndex);
    setPendingAssignments(draft.pendingAssignments);
    toast.success("Unsaved round restored");
  }

  function discardDraft() {
    clearRoundDraft();
    toast.success("Unsaved round cleared");
  }

  function choosePlayerRow(index: number) {
    const player = detectedPlayers[index];
    if (!player) return;
    setSelectedPlayerIndex(index);
    setHoles(player.holes);
    setPendingAssignments((prev) => prev.filter((item) => item.playerIndex !== index));
  }

  function assignPlayerRow(playerIndex: number, recipientUserId: string) {
    setPendingAssignments((prev) => [
      ...prev.filter(
        (item) => item.playerIndex !== playerIndex && item.recipientUserId !== recipientUserId,
      ),
      { playerIndex, recipientUserId },
    ]);
  }

  function clearPlayerAssignment(playerIndex: number) {
    setPendingAssignments((prev) => prev.filter((item) => item.playerIndex !== playerIndex));
  }

  return (
    <div className={cn("space-y-8", mode !== "choose" && "pb-28 lg:pb-0")}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">New round</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Log a scorecard</h1>
        </div>
      </div>

      {mode === "choose" && (
        <div className="space-y-4">
          {savedDraft && (
            <DraftRestoreCard
              draft={savedDraft}
              courses={courses}
              onRestore={() => restoreDraft(savedDraft)}
              onDiscard={discardDraft}
            />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
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

            <button type="button" onClick={() => setMode("manual")} className="group text-left">
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

              {detectedPlayers.length > 1 && (
                <DetectedPlayersPanel
                  players={detectedPlayers}
                  selectedPlayerIndex={selectedPlayerIndex}
                  assignments={pendingAssignments}
                  shareableUsers={shareableUsers}
                  onChooseMine={choosePlayerRow}
                  onAssign={assignPlayerRow}
                  onClearAssignment={clearPlayerAssignment}
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
            <Button
              onClick={saveRound}
              disabled={saveDisabled}
              className="hidden lg:inline-flex"
            >
              <Save className="mr-1 h-4 w-4" /> {submitting ? "Saving..." : "Save round"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {needsTee && (
            <p className="text-right text-xs text-muted-foreground">
              Pick a tee above before saving.
            </p>
          )}
          {needsPlayerRow && (
            <p className="text-right text-xs text-muted-foreground">
              Choose which detected player row is yours.
            </p>
          )}
          {hasIncompleteAssignments && (
            <p className="text-right text-xs text-muted-foreground">
              Assigned player rows must have complete scores before saving.
            </p>
          )}
        </Card>
      )}
      {mode !== "choose" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {completedHoles}/{holeCount} holes
              </div>
              <div className="number-mono truncate text-lg font-semibold">
                {totalStrokes || "—"}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  par {totalPar}
                </span>
              </div>
            </div>
            <Button className="h-11 px-4" onClick={saveRound} disabled={saveDisabled}>
              <Save className="mr-1 h-4 w-4" />
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DraftRestoreCard({
  draft,
  courses,
  onRestore,
  onDiscard,
}: {
  draft: RoundDraft;
  courses: CourseWithTees[];
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const course = courses.find((c) => c.id === draft.courseId);
  const completed = draft.holes.filter((h) => h.strokes != null && !h.illegible).length;
  const total = draft.holes.reduce((sum, h) => sum + (h.strokes ?? 0), 0);

  return (
    <Card className="border-primary/35 bg-primary/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <RotateCcw className="h-4 w-4 text-primary" />
            Continue unsaved round
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {course?.name ?? "Selected course"} · {draft.date} · {completed}/
            {draft.holeCount} holes · {total > 0 ? total : "no score"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
            <Trash2 className="mr-1 h-4 w-4" />
            Discard
          </Button>
          <Button type="button" size="sm" onClick={onRestore}>
            Continue
          </Button>
        </div>
      </div>
    </Card>
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

function DetectedPlayersPanel({
  players,
  selectedPlayerIndex,
  assignments,
  shareableUsers,
  onChooseMine,
  onAssign,
  onClearAssignment,
}: {
  players: DetectedPlayer[];
  selectedPlayerIndex: number | null;
  assignments: PendingAssignment[];
  shareableUsers: ShareableUser[];
  onChooseMine: (index: number) => void;
  onAssign: (playerIndex: number, recipientUserId: string) => void;
  onClearAssignment: (playerIndex: number) => void;
}) {
  const assignedUserIds = new Set(assignments.map((item) => item.recipientUserId));

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-primary" />
        Player rows detected
      </div>
      <p className="text-xs text-muted-foreground">
        Choose your row first. Other rows can be sent to app users as pending rounds.
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {players.map((player, index) => {
          const isMine = selectedPlayerIndex === index;
          const assignment = assignments.find((item) => item.playerIndex === index);
          const assignedUser = shareableUsers.find((user) => user.id === assignment?.recipientUserId);
          const unavailableUserIds = new Set(assignedUserIds);
          if (assignment) unavailableUserIds.delete(assignment.recipientUserId);

          return (
            <div
              key={`${player.rowLabel ?? "row"}-${index}`}
              className={cn(
                "rounded-xl border bg-secondary/25 p-3",
                isMine ? "border-primary/60 ring-2 ring-primary/30" : "border-border/60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight">
                    {player.playerName ?? player.rowLabel ?? `Player ${index + 1}`}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {playerSummary(player)}
                  </div>
                  {player.notes && (
                    <div className="mt-1 text-xs text-muted-foreground">{player.notes}</div>
                  )}
                </div>
                {player.confidence != null && (
                  <Badge variant="outline" className="shrink-0">
                    {Math.round(player.confidence * 100)}%
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isMine ? "default" : "outline"}
                  onClick={() => onChooseMine(index)}
                >
                  This is me
                </Button>
                {assignment && assignedUser && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onClearAssignment(index)}
                  >
                    Clear {assignedUser.name}
                  </Button>
                )}
              </div>

              {!isMine && selectedPlayerIndex == null && (
                <div className="mt-3 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                  Choose your row before sending rows to other users.
                </div>
              )}

              {!isMine && selectedPlayerIndex != null && (
                <div className="mt-3">
                  {assignment && assignedUser ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                      Pending for {assignedUser.name}
                    </div>
                  ) : (
                    <UserSearchPicker
                      users={shareableUsers.filter((user) => !unavailableUserIds.has(user.id))}
                      onChoose={(userId) => onAssign(index, userId)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserSearchPicker({
  users,
  onChoose,
}: {
  users: ShareableUser[];
  onChoose: (userId: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const matches = users
    .filter((user) => (normalized ? user.name.toLowerCase().includes(normalized) : true))
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="relative">
        <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search app users..."
          className="pl-9"
        />
      </div>
      {matches.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border/60">
          {matches.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onChoose(user.id)}
              className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/60"
            >
              {user.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
          No available app user matches.
        </div>
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

function playerSummary(player: DetectedPlayer): string {
  const complete = player.holes.filter((hole) => hole.strokes != null && !hole.illegible);
  const total = complete.reduce((sum, hole) => sum + (hole.strokes ?? 0), 0);
  const par = player.holes.reduce((sum, hole) => sum + hole.par, 0);
  return `${complete.length}/${player.holes.length} holes · ${total || "-"} · par ${par}`;
}

function buildPendingRoundAssignments(
  players: DetectedPlayer[],
  assignments: PendingAssignment[],
) {
  return assignments
    .map((assignment) => {
      const player = players[assignment.playerIndex];
      if (!player) return null;
      return {
        recipientUserId: assignment.recipientUserId,
        scorecardPlayerName: player.playerName,
        scorecardRowLabel: player.rowLabel,
        rowConfidence: player.confidence,
        rowNotes: player.notes,
        holes: player.holes.map((hole) => ({
          holeNumber: hole.holeNumber,
          par: hole.par,
          strokes: hole.strokes as number,
          putts: hole.putts ?? null,
          confidence: hole.confidence ?? null,
          illegible: false,
        })),
      };
    })
    .filter((assignment): assignment is NonNullable<typeof assignment> => assignment != null);
}

function buildRoundDraft(input: RoundDraftInput): RoundDraft | null {
  if (!hasDraftContent(input)) return null;
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    ...input,
    mode: input.mode === "ai" ? "ai" : "manual",
    holes: input.holes.map((hole) => ({ ...hole })),
    sourceImages: [...input.sourceImages],
    detectedTees: input.detectedTees.map((tee) => ({ ...tee })),
    detectedPlayers: input.detectedPlayers.map((player) => ({
      ...player,
      holes: player.holes.map((hole) => ({ ...hole })),
    })),
    pendingAssignments: input.pendingAssignments.map((assignment) => ({ ...assignment })),
  };
}

function hasDraftContent(input: RoundDraftInput): boolean {
  return (
    input.mode !== "choose" ||
    !!input.courseId ||
    !!input.teeId ||
    input.notes.trim().length > 0 ||
    input.sourceImages.length > 0 ||
    input.detectedTees.length > 0 ||
    input.detectedPlayers.length > 0 ||
    input.pendingAssignments.length > 0 ||
    input.holes.some((hole) => hole.strokes != null || hole.confidence != null || hole.illegible)
  );
}

function writeRoundDraft(draft: RoundDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

function clearRoundDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

function subscribeToDraft(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === DRAFT_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(DRAFT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DRAFT_EVENT, callback);
  };
}

function readDraftSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DRAFT_KEY);
}

function emptyDraftSnapshot(): string | null {
  return null;
}

function parseRoundDraft(raw: string | null): RoundDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RoundDraft>;
    if (value.version !== 1) return null;
    if (value.mode !== "ai" && value.mode !== "manual") return null;
    if (value.holeCount !== 9 && value.holeCount !== 18) return null;
    if (!Array.isArray(value.holes) || value.holes.length !== value.holeCount) return null;

    const holes = parseGridHoles(value.holes, value.holeCount);
    const detectedPlayers = parseDetectedPlayers(value.detectedPlayers);
    const selectedPlayerIndex =
      typeof value.selectedPlayerIndex === "number" &&
      Number.isInteger(value.selectedPlayerIndex) &&
      value.selectedPlayerIndex >= 0 &&
      value.selectedPlayerIndex < detectedPlayers.length
        ? value.selectedPlayerIndex
        : null;
    const pendingAssignments = parsePendingAssignments(
      value.pendingAssignments,
      detectedPlayers.length,
      selectedPlayerIndex,
    );

    return {
      version: 1,
      savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
      mode: value.mode,
      courseId: typeof value.courseId === "string" ? value.courseId : "",
      teeId: typeof value.teeId === "string" ? value.teeId : "",
      date:
        typeof value.date === "string" && value.date.length > 0
          ? value.date
          : new Date().toISOString().slice(0, 10),
      holeCount: value.holeCount,
      nineType: value.nineType === "front" || value.nineType === "back" ? value.nineType : null,
      holes,
      notes: typeof value.notes === "string" ? value.notes : "",
      sourceImages: Array.isArray(value.sourceImages)
        ? value.sourceImages.filter((item): item is string => typeof item === "string")
        : [],
      extractionModel:
        typeof value.extractionModel === "string" ? value.extractionModel : null,
      extractionNotes:
        typeof value.extractionNotes === "string" ? value.extractionNotes : null,
      detectedTees: Array.isArray(value.detectedTees)
        ? value.detectedTees.map((tee) => {
            const item =
              tee && typeof tee === "object" ? (tee as Partial<DetectedTee>) : {};
            return {
              name: typeof item.name === "string" ? item.name : null,
              color: typeof item.color === "string" ? item.color : null,
              rating: typeof item.rating === "number" ? item.rating : null,
              slope: typeof item.slope === "number" ? item.slope : null,
              yardage: typeof item.yardage === "number" ? item.yardage : null,
            };
          })
        : [],
      chosenDetectedTeeName:
        typeof value.chosenDetectedTeeName === "string" ? value.chosenDetectedTeeName : null,
      detectedPlayers,
      selectedPlayerIndex,
      pendingAssignments,
    };
  } catch {
    return null;
  }
}

function parseGridHoles(value: unknown, expectedLength: number): GridHole[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, expectedLength).map((hole, index) => {
    const item = hole && typeof hole === "object" ? (hole as Partial<GridHole>) : {};
    return {
      holeNumber: typeof item.holeNumber === "number" ? item.holeNumber : index + 1,
      par: typeof item.par === "number" ? item.par : 4,
      strokes: typeof item.strokes === "number" ? item.strokes : null,
      putts: typeof item.putts === "number" ? item.putts : null,
      confidence: typeof item.confidence === "number" ? item.confidence : null,
      illegible: item.illegible === true,
    };
  });
}

function parseDetectedPlayers(value: unknown): DetectedPlayer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((player, index) => {
      const item =
        player && typeof player === "object" ? (player as Partial<DetectedPlayer>) : {};
      if (!Array.isArray(item.holes) || (item.holes.length !== 9 && item.holes.length !== 18)) {
        return null;
      }
      return {
        playerName: typeof item.playerName === "string" ? item.playerName : null,
        rowLabel: typeof item.rowLabel === "string" ? item.rowLabel : `Player ${index + 1}`,
        holes: parseGridHoles(item.holes, item.holes.length),
        confidence: typeof item.confidence === "number" ? item.confidence : null,
        notes: typeof item.notes === "string" ? item.notes : null,
      };
    })
    .filter((player): player is NonNullable<typeof player> => player != null);
}

function parsePendingAssignments(
  value: unknown,
  playerCount: number,
  selectedPlayerIndex: number | null,
): PendingAssignment[] {
  if (!Array.isArray(value)) return [];
  const seenPlayers = new Set<number>();
  const seenRecipients = new Set<string>();
  const parsed: PendingAssignment[] = [];

  for (const assignment of value) {
    const item =
      assignment && typeof assignment === "object"
        ? (assignment as Partial<PendingAssignment>)
        : {};
    if (
      typeof item.playerIndex !== "number" ||
      !Number.isInteger(item.playerIndex) ||
      item.playerIndex < 0 ||
      item.playerIndex >= playerCount ||
      item.playerIndex === selectedPlayerIndex ||
      typeof item.recipientUserId !== "string" ||
      item.recipientUserId.length === 0 ||
      seenPlayers.has(item.playerIndex) ||
      seenRecipients.has(item.recipientUserId)
    ) {
      continue;
    }
    seenPlayers.add(item.playerIndex);
    seenRecipients.add(item.recipientUserId);
    parsed.push({ playerIndex: item.playerIndex, recipientUserId: item.recipientUserId });
  }

  return parsed;
}
