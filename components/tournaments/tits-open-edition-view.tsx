import Image from "next/image";
import Link from "next/link";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  CalendarDays,
  Camera,
  Flag,
  Map as MapIcon,
  Medal,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildParticipantLeaderboard,
  buildTeamLeaderboard,
  getEditionConfigText,
  getTournamentCourseGuides,
  type TournamentEditionFull,
} from "@/lib/tournaments";

type EditionSummary = {
  year: number;
  title: string;
  status: string;
};

const titsOpenThemeStyle = {
  "--background": "#f6f0df",
  "--foreground": "#132018",
  "--card": "#fffaf0",
  "--card-foreground": "#132018",
  "--popover": "#fffaf0",
  "--popover-foreground": "#132018",
  "--primary": "#c9a227",
  "--primary-foreground": "#123524",
  "--secondary": "#f6f0df",
  "--secondary-foreground": "#132018",
  "--muted": "#dce8c8",
  "--muted-foreground": "rgb(19 32 24 / 70%)",
  "--border": "#dce8c8",
  "--input": "#dce8c8",
  "--ring": "#c9a227",
} as CSSProperties;

const tournamentCardClass =
  "rounded-lg border border-border bg-card text-card-foreground shadow-sm ring-0";

export function TitsOpenEditionView({
  edition,
  editions,
  isAdmin,
  scoreSubmitHref,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
}) {
  if (edition.layoutKey === "tits-open-2025-empty") {
    return (
      <TitsOpenArchiveShell
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        scoreSubmitHref={scoreSubmitHref}
      />
    );
  }

  return (
    <TitsOpen2026View
      edition={edition}
      editions={editions}
      isAdmin={isAdmin}
      scoreSubmitHref={scoreSubmitHref}
    />
  );
}

function TitsOpen2026View({
  edition,
  editions,
  isAdmin,
  scoreSubmitHref,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
}) {
  const playerRows = buildParticipantLeaderboard(edition);
  const teamRows = buildTeamLeaderboard(edition);
  const guides = getTournamentCourseGuides(edition);
  const quote = getEditionConfigText(edition, "quote");
  const honors = edition.series.honors.filter((honor) => !honor.year || honor.year <= edition.year);

  return (
    <div
      className="relative left-1/2 -mx-4 -my-6 w-screen -translate-x-1/2 bg-background text-foreground sm:-mx-6 lg:-mx-8 lg:-my-10"
      style={titsOpenThemeStyle}
    >
      <EditionHero
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        quote={quote}
        scoreSubmitHref={scoreSubmitHref}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatTile icon={Users} label="Players" value={edition.participants.length} />
          <StatTile icon={Shield} label="Teams" value={edition.teams.length} />
          <StatTile icon={Flag} label="Rounds" value={edition.courses.length} />
          <StatTile icon={Trophy} label="Scores" value={edition.scores.length} />
          <StatTile icon={Medal} label="Honors" value={honors.length} />
        </div>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <LeaderboardCard title="Individual leaderboard" rows={playerRows} />
          <TeamLeaderboardCard rows={teamRows} />
        </section>

        <HonorsPanel honors={honors} />

        <section className="grid gap-4 lg:grid-cols-2">
          <TeamsPanel edition={edition} />
          <SchedulePanel edition={edition} />
        </section>

        <ParticipantsPanel edition={edition} rows={playerRows} />

        <CourseGuidePanel edition={edition} guides={guides} />
      </div>
    </div>
  );
}

function HonorsPanel({
  honors,
}: {
  honors: TournamentEditionFull["series"]["honors"];
}) {
  return (
    <Card className={`${tournamentCardClass} p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Past champions</p>
          <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">Tits Open history</h2>
        </div>
        <Trophy className="h-5 w-5 text-primary" />
      </div>
      {honors.length === 0 ? (
        <EmptyLine text="No champions have been added yet." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {honors.map((honor) => (
            <div key={honor.id} className="rounded-md border border-border bg-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-border text-[#1f5c3a]">
                  {honor.year ?? "Legacy"}
                </Badge>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {honor.type === "TEAM_CHAMPION" ? "Team" : "Individual"}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-bold tracking-tight">
                {honor.teamName ?? honor.participantName ?? honor.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#1f5c3a]">{honor.title}</p>
              {honor.notes && (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{honor.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TitsOpenArchiveShell({
  edition,
  editions,
  isAdmin,
  scoreSubmitHref,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
}) {
  return (
    <div
      className="relative left-1/2 -mx-4 -my-6 w-screen -translate-x-1/2 bg-background text-foreground sm:-mx-6 lg:-mx-8 lg:-my-10"
      style={titsOpenThemeStyle}
    >
      <EditionHero
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        quote="This archive is ready for the original teams, course, photos, and scores."
        scoreSubmitHref={scoreSubmitHref}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className={`${tournamentCardClass} p-8`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Archive shell</p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
                2025 is waiting for the receipts
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add the venue, participants, teams, and scores from the first Tits Open when
                you are ready. The year already has its own route and admin setup.
              </p>
            </div>
            {isAdmin && (
              <Button asChild>
                <Link href={`/tits-open/${edition.year}/admin`}>Fill archive</Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EditionHero({
  edition,
  editions,
  isAdmin,
  quote,
  scoreSubmitHref,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  quote: string | null;
  scoreSubmitHref?: string | null;
}) {
  return (
    <section className="relative min-h-[calc(100svh-8rem)] w-full overflow-hidden border-b border-[#c9a227]/50 bg-[#123524]">
      {edition.heroImage ? (
        <Image
          src={edition.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#123524]" />
      )}
      <div className="absolute inset-0 bg-[#123524]/65 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-8rem)] max-w-6xl flex-col justify-end px-4 pb-10 pt-24 text-[#fffaf0] sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {editions.map((item) => (
            <Button
              key={item.year}
              asChild
              variant={item.year === edition.year ? "default" : "outline"}
              size="sm"
              className={
                item.year === edition.year
                  ? "bg-[#c9a227] text-[#123524] hover:bg-[#fffaf0]"
                  : "border-[#fffaf0]/70 bg-transparent text-[#fffaf0] hover:border-[#c9a227] hover:bg-[#c9a227]/15"
              }
            >
              <Link href={`/tits-open/${item.year}`}>{item.year}</Link>
            </Button>
          ))}
        </div>

        <div className="max-w-4xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            {edition.logoImage && (
              <Image
                src={edition.logoImage}
                alt=""
                width={180}
                height={210}
                priority
                className="h-auto w-20 sm:w-24"
              />
            )}
            <div>
              <Badge variant="outline" className="border-[#c9a227]/70 bg-[#123524]/50 text-[#c9a227]">
                {edition.status.toLowerCase()} · {edition.location ?? "Quebec"}
              </Badge>
              <h1 className="mt-4 font-serif text-6xl font-black leading-[0.92] text-balance sm:text-7xl lg:text-8xl">
                {edition.title}
              </h1>
            </div>
          </div>
          {edition.subtitle && (
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#fffaf0]/85">
              {edition.subtitle}
            </p>
          )}
          {quote && (
            <blockquote className="mt-5 max-w-3xl text-xl font-medium leading-8 text-[#fffaf0] sm:text-2xl">
              &ldquo;{quote}&rdquo;
            </blockquote>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[#c9a227] text-[#123524] hover:bg-[#fffaf0]">
              <a href="#leaderboard">
                <Trophy className="mr-1 h-4 w-4" /> Leaderboard
              </a>
            </Button>
            {scoreSubmitHref && (
              <Button
                asChild
                variant="secondary"
                className="bg-[#fffaf0] text-[#123524] hover:bg-[#c9a227]"
              >
                <Link href={scoreSubmitHref}>
                  <Camera className="mr-1 h-4 w-4" /> Submit scorecard
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="border-[#fffaf0]/70 bg-transparent text-[#fffaf0] hover:border-[#c9a227] hover:bg-[#c9a227]/15"
            >
              <a href="#course-guide">
                <MapIcon className="mr-1 h-4 w-4" /> Course guide
              </a>
            </Button>
            {isAdmin && (
              <Button asChild variant="secondary" className="bg-[#fffaf0] text-[#123524] hover:bg-[#c9a227]">
                <Link href={`/tits-open/${edition.year}/admin`}>Admin</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardCard({
  title,
  rows,
}: {
  title: string;
  rows: ReturnType<typeof buildParticipantLeaderboard>;
}) {
  return (
    <Card id="leaderboard" className={`${tournamentCardClass} p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Gross + net</p>
          <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        <Medal className="h-5 w-5 text-primary" />
      </div>
      {rows.length === 0 ? (
        <EmptyLine text="No tournament players yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.participantId}
              className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-border bg-secondary p-3 sm:grid-cols-[auto_1fr_auto]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#123524] text-sm font-bold text-[#fffaf0]">
                {row.rank ? `#${row.rank}` : "-"}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{row.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {row.scoreCount} score{row.scoreCount === 1 ? "" : "s"}
                  {row.nickname ? ` · ${row.nickname}` : ""}
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1 sm:w-56">
                <MiniMetric label="Gross" value={formatNumber(row.grossTotal)} />
                <MiniMetric label="Net" value={formatNumber(row.netTotal)} />
                <MiniMetric label="CH" value={row.courseHandicapTotal} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TeamLeaderboardCard({
  rows,
}: {
  rows: ReturnType<typeof buildTeamLeaderboard>;
}) {
  return (
    <Card className={`${tournamentCardClass} p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Team total</p>
          <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">Teams</h2>
        </div>
        <Shield className="h-5 w-5 text-primary" />
      </div>
      {rows.length === 0 ? (
        <EmptyLine text="No teams yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.teamId} className="flex items-center gap-3 rounded-md border border-border bg-secondary p-3">
              {row.logoImage ? (
                <Image
                  src={row.logoImage}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-contain"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.rank ? `#${row.rank}` : "-"}</span>
                  <span className="truncate font-medium">{row.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.memberCount} members · {row.scoreCount} scores
                </div>
              </div>
              <div className="text-right">
                <div className="number-mono text-xl font-semibold">{formatNumber(row.netTotal)}</div>
                <div className="text-xs text-muted-foreground">net</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TeamsPanel({ edition }: { edition: TournamentEditionFull }) {
  return (
    <Card className={`${tournamentCardClass} p-5`}>
      <h2 className="font-serif text-3xl font-bold tracking-tight">Team room</h2>
      <div className="mt-5 grid gap-3">
        {edition.teams.length === 0 ? (
          <EmptyLine text="No teams have been assigned." />
        ) : (
          edition.teams.map((team) => (
            <div key={team.id} className="rounded-md border border-border bg-secondary p-4">
              <div className="flex items-center gap-3">
                {team.logoImage && (
                  <Image
                    src={team.logoImage}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                  />
                )}
                <h3 className="text-lg font-semibold">{team.name}</h3>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-sm"
                  >
                    {member.participant.image && (
                      <Image
                        src={member.participant.image}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                    <span className="truncate">{member.participant.displayName}</span>
                  </div>
                ))}
              </div>
              {team.description && (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{team.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function SchedulePanel({ edition }: { edition: TournamentEditionFull }) {
  const grouped = new Map<string, typeof edition.schedule>();
  for (const item of edition.schedule) {
    grouped.set(item.dayLabel, [...(grouped.get(item.dayLabel) ?? []), item]);
  }

  return (
    <Card className={`${tournamentCardClass} p-5`}>
      <h2 className="font-serif text-3xl font-bold tracking-tight">Weekend schedule</h2>
      <div className="mt-5 space-y-5">
        {grouped.size === 0 ? (
          <EmptyLine text="No schedule items yet." />
        ) : (
          [...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarDays className="h-4 w-4" />
                {day}
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border border-border bg-secondary px-3 py-2">
                    <div className="text-sm font-medium">
                      {item.timeLabel ? `${item.timeLabel} · ` : ""}
                      {item.title}
                    </div>
                    {item.details && (
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ParticipantsPanel({
  edition,
  rows,
}: {
  edition: TournamentEditionFull;
  rows: ReturnType<typeof buildParticipantLeaderboard>;
}) {
  const rowById = new Map(rows.map((row) => [row.participantId, row]));
  return (
    <Card className={`${tournamentCardClass} p-5`}>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Field</p>
        <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">Players</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {edition.participants.map((participant) => {
          const row = rowById.get(participant.id);
          return (
            <div
              key={participant.id}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              {participant.image ? (
                <div className="relative h-52">
                  <Image
                    src={participant.image}
                    alt={participant.displayName}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-52 place-items-center bg-primary/10 text-primary">
                  <Users className="h-8 w-8" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{participant.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {participant.nickname ?? participant.role.toLowerCase()}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-border text-[#1f5c3a]">
                    {participant.role.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniMetric label="Net" value={formatNumber(row?.netTotal ?? null)} />
                  <MiniMetric label="Scores" value={row?.scoreCount ?? 0} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <MiniMetric label="Solo wins" value={participant.individualWins} />
                  <MiniMetric label="Team wins" value={participant.teamWins} />
                </div>
                {participant.bio && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {participant.bio}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CourseGuidePanel({
  edition,
  guides,
}: {
  edition: TournamentEditionFull;
  guides: ReturnType<typeof getTournamentCourseGuides>;
}) {
  return (
    <section id="course-guide" className="space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Course guide</p>
        <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight">Scout the trouble</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {edition.courses.map((entry) => {
          const guide = guides.find((item) => item.courseName === entry.course.name);
          const teeTime = getTournamentCourseTeeTime(edition, entry.dayLabel);
          return (
            <Card key={entry.id} className={`${tournamentCardClass} overflow-hidden p-0`}>
              <div className="relative h-56 bg-secondary">
                {guide?.image && (
                  <Image
                    src={guide.image}
                    alt={entry.course.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-[#123524]/35" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="mb-2">{guide?.tagline ?? `Round ${entry.roundNumber}`}</Badge>
                  <h3 className="font-serif text-3xl font-bold tracking-tight text-[#fffaf0]">
                    {entry.course.name}
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {guide?.summary ?? entry.notes ?? "Tournament course details coming soon."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniMetric label="Day" value={entry.dayLabel ?? "-"} />
                  <MiniMetric label="Tee time" value={teeTime ?? "-"} />
                  <MiniMetric label="Holes" value={entry.holeCount} />
                  <MiniMetric label="Tee" value={entry.tee?.name ?? "-"} />
                </div>
                {guide?.mapPrefix && (
                  <HoleMapCarousel courseName={entry.course.name} mapPrefix={guide.mapPrefix} />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function HoleMapCarousel({ courseName, mapPrefix }: { courseName: string; mapPrefix: string }) {
  return (
    <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2">
      <div className="flex snap-x snap-mandatory gap-3">
        {Array.from({ length: 18 }, (_, index) => index + 1).map((hole) => (
          <div
            key={`${courseName}-${hole}`}
            className="w-[76vw] shrink-0 snap-start overflow-hidden rounded-md border border-border bg-card sm:w-56"
          >
            <div className="relative h-72">
              <Image
                src={`${mapPrefix}${hole}.webp`}
                alt={`${courseName} hole ${hole}`}
                fill
                sizes="(min-width: 640px) 224px, 76vw"
                className="object-contain p-2"
              />
            </div>
            <div className="border-t border-border/60 px-3 py-2 text-sm font-medium">
              Hole {hole}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTournamentCourseTeeTime(
  edition: TournamentEditionFull,
  dayLabel: string | null,
) {
  if (!dayLabel) return null;
  const teeOff = edition.schedule.find(
    (item) =>
      item.dayLabel.toLowerCase() === dayLabel.toLowerCase() &&
      item.title.toLowerCase() === "tee off",
  );
  return teeOff?.timeLabel ?? null;
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card className={`${tournamentCardClass} p-4`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="number-mono mt-2 text-3xl font-semibold">{value}</div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md bg-secondary p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono mt-1 truncate text-base font-semibold">{value}</div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  return value == null ? "-" : value;
}
