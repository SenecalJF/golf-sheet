"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type TournamentAdminDto = {
  id: string;
  year: number;
  title: string;
  courses: CourseEntryDto[];
  participants: ParticipantDto[];
  teams: TeamDto[];
  schedule: ScheduleDto[];
  scores: ScoreDto[];
};

export type TournamentAdminOptionsDto = {
  courses: {
    id: string;
    name: string;
    city: string;
    tees: { id: string; name: string }[];
  }[];
  users: { id: string; name: string; email: string }[];
  rounds: {
    id: string;
    userId: string | null;
    userName: string;
    courseName: string;
    date: string;
    totalStrokes: number;
    totalPar: number;
  }[];
};

type CourseEntryDto = {
  id: string;
  courseId: string;
  teeId: string | null;
  roundNumber: number;
  dayLabel: string | null;
  holeCount: number;
  notes: string | null;
  courseName: string;
  teeName: string | null;
};

type ParticipantDto = {
  id: string;
  userId: string | null;
  displayName: string;
  slug: string;
  nickname: string | null;
  country: string | null;
  bio: string | null;
  role: string;
  image: string | null;
  handicapSnapshot: number | null;
  courseHandicapSnapshot: number | null;
  individualWins: number;
  teamWins: number;
  displayOrder: number;
};

type TeamDto = {
  id: string;
  name: string;
  description: string | null;
  logoImage: string | null;
  logoAlt: string | null;
  displayOrder: number;
  participantIds: string[];
};

type ScheduleDto = {
  id: string;
  dayLabel: string;
  timeLabel: string | null;
  title: string;
  details: string | null;
  displayOrder: number;
};

type ScoreDto = {
  id: string;
  participantId: string;
  participantName: string;
  editionCourseId: string | null;
  courseName: string | null;
  roundId: string | null;
  grossStrokes: number;
  totalPar: number;
  netStrokes: number | null;
  courseHandicapSnapshot: number | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary";
const textareaClass =
  "min-h-20 w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function TitsOpenAdmin({
  edition,
  options,
}: {
  edition: TournamentAdminDto;
  options: TournamentAdminOptionsDto;
}) {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/tits-open/${edition.year}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Tits Open {edition.year}
          </Link>
        </Button>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {edition.title} admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Setup participants, teams, course rounds, schedule, and leaderboard scores.
        </p>
      </div>

      <AdminSection title="Tournament courses">
        <div className="grid gap-3">
          {edition.courses.map((entry) => (
            <CourseEntryForm
              key={entry.id}
              editionId={edition.id}
              entry={entry}
              courses={options.courses}
            />
          ))}
          <CourseEntryForm editionId={edition.id} courses={options.courses} />
        </div>
      </AdminSection>

      <AdminSection title="Participants">
        <div className="grid gap-3">
          {edition.participants.map((participant) => (
            <ParticipantForm
              key={participant.id}
              editionId={edition.id}
              participant={participant}
              users={options.users}
            />
          ))}
          <ParticipantForm editionId={edition.id} users={options.users} />
        </div>
      </AdminSection>

      <AdminSection title="Teams">
        <div className="grid gap-3">
          {edition.teams.map((team) => (
            <TeamForm
              key={team.id}
              editionId={edition.id}
              team={team}
              participants={edition.participants}
            />
          ))}
          <TeamForm editionId={edition.id} participants={edition.participants} />
        </div>
      </AdminSection>

      <AdminSection title="Schedule">
        <div className="grid gap-3">
          {edition.schedule.map((item) => (
            <ScheduleForm key={item.id} editionId={edition.id} item={item} />
          ))}
          <ScheduleForm editionId={edition.id} />
        </div>
      </AdminSection>

      <AdminSection title="Scores">
        <ScoreForm edition={edition} rounds={options.rounds} />
        <ScoreList editionId={edition.id} scores={edition.scores} />
      </AdminSection>
    </div>
  );
}

function AdminSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-5 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </Card>
  );
}

function CourseEntryForm({
  courses,
  editionId,
  entry,
}: {
  courses: TournamentAdminOptionsDto["courses"];
  editionId: string;
  entry?: CourseEntryDto;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState(entry?.courseId ?? courses[0]?.id ?? "");
  const selectedCourse = courses.find((course) => course.id === courseId);

  async function submit(formData: FormData) {
    await saveJson(
      entry
        ? `/api/tournaments/${editionId}/courses/${entry.id}`
        : `/api/tournaments/${editionId}/courses`,
      entry ? "PATCH" : "POST",
      {
        courseId,
        teeId: optionalString(formData, "teeId"),
        roundNumber: numberValue(formData, "roundNumber", entry?.roundNumber ?? 1),
        dayLabel: optionalString(formData, "dayLabel"),
        holeCount: numberValue(formData, "holeCount", entry?.holeCount ?? 18),
        notes: optionalString(formData, "notes"),
      },
      router,
    );
  }

  return (
    <form action={submit} className="rounded-xl border border-border/60 bg-secondary/25 p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <Field label="Course" className="md:col-span-2">
          <select className={inputClass} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} - {course.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tee">
          <select name="teeId" className={inputClass} defaultValue={entry?.teeId ?? ""}>
            <option value="">No tee</option>
            {(selectedCourse?.tees ?? []).map((tee) => (
              <option key={tee.id} value={tee.id}>
                {tee.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Round">
          <input name="roundNumber" type="number" className={inputClass} defaultValue={entry?.roundNumber ?? 1} min={1} />
        </Field>
        <Field label="Holes">
          <select name="holeCount" className={inputClass} defaultValue={entry?.holeCount ?? 18}>
            <option value="18">18</option>
            <option value="9">9</option>
          </select>
        </Field>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <Field label="Day">
          <input name="dayLabel" className={inputClass} defaultValue={entry?.dayLabel ?? ""} placeholder="Saturday" />
        </Field>
        <Field label="Notes">
          <input name="notes" className={inputClass} defaultValue={entry?.notes ?? ""} />
        </Field>
        <FormActions router={router} deleteUrl={entry ? `/api/tournaments/${editionId}/courses/${entry.id}` : null} />
      </div>
    </form>
  );
}

function ParticipantForm({
  editionId,
  participant,
  users,
}: {
  editionId: string;
  participant?: ParticipantDto;
  users: TournamentAdminOptionsDto["users"];
}) {
  const router = useRouter();

  async function submit(formData: FormData) {
    await saveJson(
      participant
        ? `/api/tournaments/${editionId}/participants/${participant.id}`
        : `/api/tournaments/${editionId}/participants`,
      participant ? "PATCH" : "POST",
      {
        userId: optionalString(formData, "userId"),
        displayName: stringValue(formData, "displayName"),
        slug: optionalString(formData, "slug"),
        nickname: optionalString(formData, "nickname"),
        country: optionalString(formData, "country"),
        bio: optionalString(formData, "bio"),
        role: stringValue(formData, "role") || "PLAYER",
        image: optionalString(formData, "image"),
        handicapSnapshot: nullableNumber(formData, "handicapSnapshot"),
        courseHandicapSnapshot: nullableNumber(formData, "courseHandicapSnapshot"),
        individualWins: numberValue(formData, "individualWins", participant?.individualWins ?? 0),
        teamWins: numberValue(formData, "teamWins", participant?.teamWins ?? 0),
        displayOrder: numberValue(formData, "displayOrder", participant?.displayOrder ?? 0),
      },
      router,
    );
  }

  return (
    <form action={submit} className="rounded-xl border border-border/60 bg-secondary/25 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Name">
          <input name="displayName" required className={inputClass} defaultValue={participant?.displayName ?? ""} />
        </Field>
        <Field label="Linked user">
          <select name="userId" className={inputClass} defaultValue={participant?.userId ?? ""}>
            <option value="">Guest / no user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <select name="role" className={inputClass} defaultValue={participant?.role ?? "PLAYER"}>
            <option value="PLAYER">Player</option>
            <option value="CADDIE">Caddie</option>
            <option value="GUEST">Guest</option>
          </select>
        </Field>
        <Field label="Order">
          <input name="displayOrder" type="number" className={inputClass} defaultValue={participant?.displayOrder ?? 0} />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-5">
        <Field label="Slug">
          <input name="slug" className={inputClass} defaultValue={participant?.slug ?? ""} />
        </Field>
        <Field label="Nickname">
          <input name="nickname" className={inputClass} defaultValue={participant?.nickname ?? ""} />
        </Field>
        <Field label="Country">
          <input name="country" className={inputClass} defaultValue={participant?.country ?? ""} />
        </Field>
        <Field label="HCP">
          <input name="handicapSnapshot" type="number" step="0.1" className={inputClass} defaultValue={participant?.handicapSnapshot ?? ""} />
        </Field>
        <Field label="Course HCP">
          <input name="courseHandicapSnapshot" type="number" className={inputClass} defaultValue={participant?.courseHandicapSnapshot ?? ""} />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Individual wins">
          <input name="individualWins" type="number" min={0} className={inputClass} defaultValue={participant?.individualWins ?? 0} />
        </Field>
        <Field label="Team wins">
          <input name="teamWins" type="number" min={0} className={inputClass} defaultValue={participant?.teamWins ?? 0} />
        </Field>
      </div>
      <Field label="Bio" className="mt-3">
        <textarea name="bio" className={textareaClass} defaultValue={participant?.bio ?? ""} />
      </Field>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <Field label="Image path">
          <input name="image" className={inputClass} defaultValue={participant?.image ?? ""} />
        </Field>
        <FormActions router={router} deleteUrl={participant ? `/api/tournaments/${editionId}/participants/${participant.id}` : null} />
      </div>
    </form>
  );
}

function TeamForm({
  editionId,
  participants,
  team,
}: {
  editionId: string;
  participants: ParticipantDto[];
  team?: TeamDto;
}) {
  const router = useRouter();

  async function submit(formData: FormData) {
    await saveJson(
      team ? `/api/tournaments/${editionId}/teams/${team.id}` : `/api/tournaments/${editionId}/teams`,
      team ? "PATCH" : "POST",
      {
        name: stringValue(formData, "name"),
        description: optionalString(formData, "description"),
        logoImage: optionalString(formData, "logoImage"),
        logoAlt: optionalString(formData, "logoAlt"),
        displayOrder: numberValue(formData, "displayOrder", team?.displayOrder ?? 0),
        participantIds: formData.getAll("participantIds").map(String),
      },
      router,
    );
  }

  return (
    <form action={submit} className="rounded-xl border border-border/60 bg-secondary/25 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Team name">
          <input name="name" required className={inputClass} defaultValue={team?.name ?? ""} />
        </Field>
        <Field label="Logo">
          <input name="logoImage" className={inputClass} defaultValue={team?.logoImage ?? ""} />
        </Field>
        <Field label="Logo alt">
          <input name="logoAlt" className={inputClass} defaultValue={team?.logoAlt ?? ""} />
        </Field>
        <Field label="Order">
          <input name="displayOrder" type="number" className={inputClass} defaultValue={team?.displayOrder ?? 0} />
        </Field>
      </div>
      <Field label="Team bio" className="mt-3">
        <textarea name="description" className={textareaClass} defaultValue={team?.description ?? ""} />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        {participants
          .filter((participant) => participant.role !== "CADDIE")
          .map((participant) => (
            <label key={participant.id} className="flex h-10 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm">
              <input
                type="checkbox"
                name="participantIds"
                value={participant.id}
                defaultChecked={team?.participantIds.includes(participant.id)}
              />
              {participant.displayName}
            </label>
          ))}
      </div>
      <div className="mt-3 flex justify-end">
        <FormActions router={router} deleteUrl={team ? `/api/tournaments/${editionId}/teams/${team.id}` : null} />
      </div>
    </form>
  );
}

function ScheduleForm({ editionId, item }: { editionId: string; item?: ScheduleDto }) {
  const router = useRouter();

  async function submit(formData: FormData) {
    await saveJson(
      item
        ? `/api/tournaments/${editionId}/schedule/${item.id}`
        : `/api/tournaments/${editionId}/schedule`,
      item ? "PATCH" : "POST",
      {
        dayLabel: stringValue(formData, "dayLabel"),
        timeLabel: optionalString(formData, "timeLabel"),
        title: stringValue(formData, "title"),
        details: optionalString(formData, "details"),
        displayOrder: numberValue(formData, "displayOrder", item?.displayOrder ?? 0),
      },
      router,
    );
  }

  return (
    <form action={submit} className="rounded-xl border border-border/60 bg-secondary/25 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_1fr_auto]">
        <Field label="Day">
          <input name="dayLabel" required className={inputClass} defaultValue={item?.dayLabel ?? ""} />
        </Field>
        <Field label="Time">
          <input name="timeLabel" className={inputClass} defaultValue={item?.timeLabel ?? ""} />
        </Field>
        <Field label="Title">
          <input name="title" required className={inputClass} defaultValue={item?.title ?? ""} />
        </Field>
        <Field label="Order">
          <input name="displayOrder" type="number" className={inputClass} defaultValue={item?.displayOrder ?? 0} />
        </Field>
        <FormActions router={router} deleteUrl={item ? `/api/tournaments/${editionId}/schedule/${item.id}` : null} />
      </div>
      <Field label="Details" className="mt-3">
        <textarea name="details" className={textareaClass} defaultValue={item?.details ?? ""} />
      </Field>
    </form>
  );
}

function ScoreForm({
  edition,
  rounds,
}: {
  edition: TournamentAdminDto;
  rounds: TournamentAdminOptionsDto["rounds"];
}) {
  const router = useRouter();
  const [participantId, setParticipantId] = React.useState(edition.participants[0]?.id ?? "");
  const [useHoleGrid, setUseHoleGrid] = React.useState(false);
  const selectedParticipant = edition.participants.find((participant) => participant.id === participantId);
  const linkedRounds = rounds.filter((round) => round.userId && round.userId === selectedParticipant?.userId);
  const holes = Array.from({ length: 18 }, (_, index) => index + 1);

  async function submit(formData: FormData) {
    const holePayload = useHoleGrid
      ? holes.map((hole) => ({
          holeNumber: hole,
          par: numberValue(formData, `par-${hole}`, 4),
          strokes: numberValue(formData, `strokes-${hole}`, 0),
        }))
      : [];
    const completeHoles = holePayload.filter((hole) => hole.strokes > 0);
    if (useHoleGrid && completeHoles.length !== holes.length) {
      toast.error("Fill all 18 hole scores or turn off hole-by-hole entry");
      return;
    }

    await saveJson(
      `/api/tournaments/${edition.id}/scores`,
      "POST",
      {
        participantId,
        editionCourseId: optionalString(formData, "editionCourseId"),
        roundId: optionalString(formData, "roundId"),
        grossStrokes: nullableNumber(formData, "grossStrokes"),
        totalPar: nullableNumber(formData, "totalPar"),
        courseHandicapSnapshot: nullableNumber(formData, "courseHandicapSnapshot"),
        handicapSnapshot: nullableNumber(formData, "handicapSnapshot"),
        netStrokes: nullableNumber(formData, "netStrokes"),
        notes: optionalString(formData, "notes"),
        holes: useHoleGrid ? completeHoles : undefined,
      },
      router,
    );
  }

  return (
    <form action={submit} className="rounded-xl border border-border/60 bg-secondary/25 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Participant">
          <select className={inputClass} value={participantId} onChange={(event) => setParticipantId(event.target.value)}>
            {edition.participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.displayName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tournament round">
          <select name="editionCourseId" className={inputClass} defaultValue={edition.courses[0]?.id ?? ""}>
            <option value="">No course round</option>
            {edition.courses.map((course) => (
              <option key={course.id} value={course.id}>
                Round {course.roundNumber} - {course.courseName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Linked personal round">
          <select name="roundId" className={inputClass} defaultValue="">
            <option value="">Manual tournament score</option>
            {linkedRounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.courseName} - {round.date} - {round.totalStrokes}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        <Field label="Gross">
          <input name="grossStrokes" type="number" className={inputClass} />
        </Field>
        <Field label="Par">
          <input name="totalPar" type="number" className={inputClass} />
        </Field>
        <Field label="HCP">
          <input name="handicapSnapshot" type="number" step="0.1" className={inputClass} defaultValue={selectedParticipant?.handicapSnapshot ?? ""} />
        </Field>
        <Field label="Course HCP">
          <input name="courseHandicapSnapshot" type="number" className={inputClass} defaultValue={selectedParticipant?.courseHandicapSnapshot ?? ""} />
        </Field>
        <Field label="Net override">
          <input name="netStrokes" type="number" className={inputClass} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            <Plus className="mr-1 h-4 w-4" /> Save score
          </Button>
        </div>
      </div>
      <Field label="Notes" className="mt-3">
        <input name="notes" className={inputClass} />
      </Field>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={useHoleGrid} onChange={(event) => setUseHoleGrid(event.target.checked)} />
        Enter hole-by-hole strokes instead of gross/par totals
      </label>
      {useHoleGrid && (
        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-2">
          <div className="grid min-w-[980px] grid-cols-[repeat(18,minmax(0,1fr))] gap-2">
            {holes.map((hole) => (
              <div key={hole} className="rounded-lg border border-border/60 bg-background/50 p-2">
                <div className="text-center text-xs font-semibold text-muted-foreground">H{hole}</div>
                <input name={`par-${hole}`} type="number" min={3} max={6} defaultValue={4} className={`${inputClass} mt-2 px-1 text-center`} aria-label={`Hole ${hole} par`} />
                <input name={`strokes-${hole}`} type="number" min={1} max={15} className={`${inputClass} mt-2 px-1 text-center`} aria-label={`Hole ${hole} strokes`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

function ScoreList({ editionId, scores }: { editionId: string; scores: ScoreDto[] }) {
  const router = useRouter();
  if (scores.length === 0) {
    return <div className="mt-4 rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No scores yet.</div>;
  }
  return (
    <div className="mt-4 grid gap-2">
      {scores.map((score) => (
        <div key={score.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">{score.participantName}</div>
            <div className="text-xs text-muted-foreground">
              {score.courseName ?? "No course"} · gross {score.grossStrokes} · net {score.netStrokes ?? "-"}
              {score.roundId ? " · linked round" : ""}
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => deleteResource(`/api/tournaments/${editionId}/scores/${score.id}`, router)}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      ))}
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FormActions({
  deleteUrl,
  router,
}: {
  deleteUrl: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="flex items-end gap-2">
      <Button type="submit">
        <Save className="mr-1 h-4 w-4" /> Save
      </Button>
      {deleteUrl && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label="Delete"
          onClick={() => deleteResource(deleteUrl, router)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

async function saveJson(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
  router: ReturnType<typeof useRouter>,
) {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    toast.error(typeof error.error === "string" ? error.error : "Save failed");
    return;
  }
  toast.success("Saved");
  router.refresh();
}

async function deleteResource(url: string, router: ReturnType<typeof useRouter>) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    toast.error("Delete failed");
    return;
  }
  toast.success("Deleted");
  router.refresh();
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalString(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value ? value : null;
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = stringValue(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
