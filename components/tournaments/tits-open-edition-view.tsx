import Image from "next/image";
import Link from "next/link";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
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
  buildTournamentPlayerSignals,
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
  scoreSubmitLockedLabel,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
  scoreSubmitLockedLabel?: string | null;
}) {
  if (edition.layoutKey === "tits-open-2025-empty") {
    return (
      <TitsOpenArchiveShell
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        scoreSubmitHref={scoreSubmitHref}
        scoreSubmitLockedLabel={scoreSubmitLockedLabel}
      />
    );
  }

  return (
    <TitsOpen2026View
      edition={edition}
      editions={editions}
      isAdmin={isAdmin}
      scoreSubmitHref={scoreSubmitHref}
      scoreSubmitLockedLabel={scoreSubmitLockedLabel}
    />
  );
}

function TitsOpen2026View({
  edition,
  editions,
  isAdmin,
  scoreSubmitHref,
  scoreSubmitLockedLabel,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
  scoreSubmitLockedLabel?: string | null;
}) {
  const playerRows = buildParticipantLeaderboard(edition);
  const teamRows = buildTeamLeaderboard(edition);
  const playerSignals = buildTournamentPlayerSignals(edition);
  const guides = getTournamentCourseGuides(edition);
  const quote = getEditionConfigText(edition, "quote");
  const honors = edition.series.honors.filter((honor) => !honor.year || honor.year <= edition.year);

  return (
    <div
      className="relative left-1/2 -mx-4 -my-6 w-screen -translate-x-1/2 overflow-hidden bg-background text-foreground sm:-mx-6 lg:-mx-8 lg:-my-10"
      style={titsOpenThemeStyle}
    >
      <EditionHero
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        quote={quote}
        scoreSubmitHref={scoreSubmitHref}
        scoreSubmitLockedLabel={scoreSubmitLockedLabel}
      />

      <MobileSectionNav />

      <div className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
          <StatTile icon={Users} label="Players" value={edition.participants.length} />
          <StatTile icon={Shield} label="Teams" value={edition.teams.length} />
          <StatTile icon={Flag} label="Rounds" value={edition.courses.length} />
          <StatTile icon={Trophy} label="Scores" value={edition.scores.length} />
          <StatTile
            icon={Medal}
            label="Honors"
            value={honors.length}
            className="col-span-2 md:col-span-1"
          />
        </div>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <LeaderboardCard title="Individual leaderboard" rows={playerRows} />
          <TeamLeaderboardCard rows={teamRows} />
        </section>

        <PlayerLinksPanel signals={playerSignals} />

        <HonorsPanel honors={honors} />

        <section className="grid gap-4 lg:grid-cols-2">
          <TeamsPanel edition={edition} rows={teamRows} />
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
    <Card className={`${tournamentCardClass} p-4 sm:p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Past champions</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Tits Open history
          </h2>
        </div>
        <Trophy className="h-5 w-5 text-primary" />
      </div>
      {honors.length === 0 ? (
        <EmptyLine text="No champions have been added yet." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {honors.map((honor) => (
            <div key={honor.id} className="rounded-md border border-border bg-secondary p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-border text-[#1f5c3a]">
                  {honor.year ?? "Legacy"}
                </Badge>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {honor.type === "TEAM_CHAMPION" ? "Team" : "Individual"}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl font-bold tracking-tight sm:text-2xl">
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
  scoreSubmitLockedLabel,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  scoreSubmitHref?: string | null;
  scoreSubmitLockedLabel?: string | null;
}) {
  return (
    <div
      className="relative left-1/2 -mx-4 -my-6 w-screen -translate-x-1/2 overflow-hidden bg-background text-foreground sm:-mx-6 lg:-mx-8 lg:-my-10"
      style={titsOpenThemeStyle}
    >
      <EditionHero
        edition={edition}
        editions={editions}
        isAdmin={isAdmin}
        quote="This archive is ready for the original teams, course, photos, and scores."
        scoreSubmitHref={scoreSubmitHref}
        scoreSubmitLockedLabel={scoreSubmitLockedLabel}
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className={`${tournamentCardClass} p-5 sm:p-8`}>
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
  scoreSubmitLockedLabel,
}: {
  edition: TournamentEditionFull;
  editions: EditionSummary[];
  isAdmin: boolean;
  quote: string | null;
  scoreSubmitHref?: string | null;
  scoreSubmitLockedLabel?: string | null;
}) {
  return (
    <section className="relative min-h-[calc(100svh-5rem)] w-full overflow-hidden border-b border-[#c9a227]/50 bg-[#123524] sm:min-h-[calc(100svh-8rem)]">
      {edition.heroImage ? (
        <Image
          src={edition.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-[#123524]" />
      )}
      <div className="absolute inset-0 bg-[#123524]/65 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl flex-col justify-end px-4 pb-7 pt-20 text-[#fffaf0] sm:min-h-[calc(100svh-8rem)] sm:px-6 sm:pb-10 sm:pt-24 lg:px-8">
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-8 sm:px-0">
          <div className="flex min-w-max gap-2">
            {editions.map((item) => (
              <Button
                key={item.year}
                asChild
                variant={item.year === edition.year ? "default" : "outline"}
                size="sm"
                className={
                  item.year === edition.year
                    ? "h-10 bg-[#c9a227] px-4 text-[#123524] hover:bg-[#fffaf0]"
                    : "h-10 border-[#fffaf0]/70 bg-transparent px-4 text-[#fffaf0] hover:border-[#c9a227] hover:bg-[#c9a227]/15"
                }
              >
                <Link href={`/tits-open/${item.year}`}>{item.year}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            {edition.logoImage && (
              <Image
                src={edition.logoImage}
                alt=""
                width={180}
                height={210}
                priority
                className="h-auto w-16 sm:w-24"
              />
            )}
            <div>
              <Badge variant="outline" className="border-[#c9a227]/70 bg-[#123524]/50 text-[#c9a227]">
                {edition.status.toLowerCase()} · {edition.location ?? "Quebec"}
              </Badge>
              <h1 className="mt-3 max-w-[11ch] font-serif text-5xl font-black leading-[0.94] text-balance sm:mt-4 sm:max-w-none sm:text-7xl lg:text-8xl">
                {edition.title}
              </h1>
            </div>
          </div>
          {edition.subtitle && (
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#fffaf0]/85 sm:mt-6 sm:text-lg sm:leading-8">
              {edition.subtitle}
            </p>
          )}
          {quote && (
            <blockquote className="mt-4 max-w-3xl text-lg font-medium leading-7 text-[#fffaf0] sm:mt-5 sm:text-2xl sm:leading-8">
              &ldquo;{quote}&rdquo;
            </blockquote>
          )}
          <div className="mt-6 grid gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
            <Button asChild className="h-11 justify-center bg-[#c9a227] text-[#123524] hover:bg-[#fffaf0] sm:h-10">
              <a href="#leaderboard">
                <Trophy className="mr-1 h-4 w-4" /> Leaderboard
              </a>
            </Button>
            {scoreSubmitHref && (
              <Button
                asChild
                variant="secondary"
                className="h-11 justify-center bg-[#fffaf0] text-[#123524] hover:bg-[#c9a227] sm:h-10"
              >
                <Link href={scoreSubmitHref}>
                  <Camera className="mr-1 h-4 w-4" /> Submit scorecard
                </Link>
              </Button>
            )}
            {!scoreSubmitHref && scoreSubmitLockedLabel && (
              <div className="flex min-w-0 flex-col gap-1">
                <Button
                  disabled
                  variant="secondary"
                  className="h-11 justify-center bg-[#fffaf0] text-[#123524] opacity-80 sm:h-10"
                >
                  <Camera className="mr-1 h-4 w-4" /> Scorecard locked
                </Button>
                <span className="text-xs font-medium text-[#fffaf0]/80">
                  {scoreSubmitLockedLabel}
                </span>
              </div>
            )}
            <Button
              asChild
              variant="outline"
              className="h-11 justify-center border-[#fffaf0]/70 bg-transparent text-[#fffaf0] hover:border-[#c9a227] hover:bg-[#c9a227]/15 sm:h-10"
            >
              <a href="#course-guide">
                <MapIcon className="mr-1 h-4 w-4" /> Course guide
              </a>
            </Button>
            {isAdmin && (
              <Button asChild variant="secondary" className="h-11 justify-center bg-[#fffaf0] text-[#123524] hover:bg-[#c9a227] sm:h-10">
                <Link href={`/tits-open/${edition.year}/admin`}>Admin</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileSectionNav() {
  const items = [
    { href: "#leaderboard", label: "Board" },
    { href: "#teams", label: "Teams" },
    { href: "#players", label: "Players" },
    { href: "#course-guide", label: "Courses" },
  ];

  return (
    <div className="sticky top-[64px] z-20 border-y border-border bg-background/95 px-3 py-2 backdrop-blur sm:hidden">
      <nav className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="grid h-10 place-items-center rounded-md border border-border bg-card px-2 text-xs font-bold text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
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
    <Card id="leaderboard" className={`${tournamentCardClass} scroll-mt-28 p-4 sm:p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Gross + net</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        <Medal className="h-5 w-5 text-primary" />
      </div>
      {rows.length === 0 ? (
        <EmptyLine text="No tournament players yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const content = (
              <>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#123524] text-xs font-bold text-[#fffaf0] sm:h-10 sm:w-10 sm:text-sm">
                  {row.rank ? `#${row.rank}` : "-"}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1 font-medium">
                    <span className="truncate">{row.displayName}</span>
                    {row.userId && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.scoreCount} score{row.scoreCount === 1 ? "" : "s"}
                    {row.nickname ? ` · ${row.nickname}` : ""}
                    {row.userId ? " · Golf Sheet profile" : " · guest"}
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-1.5 sm:col-span-1 sm:w-56 sm:gap-2">
                  <MiniMetric label="Gross" value={formatNumber(row.grossTotal)} />
                  <MiniMetric label="Net" value={formatNumber(row.netTotal)} />
                  <MiniMetric label="CH" value={row.courseHandicapTotal} />
                </div>
              </>
            );
            const className =
              "grid grid-cols-[auto_1fr] gap-2 rounded-md border border-border bg-secondary p-3 transition sm:grid-cols-[auto_1fr_auto] sm:gap-3";

            return row.userId ? (
              <Link
                key={row.participantId}
                href={`/players/${row.userId}`}
                className={`${className} hover:border-primary/70 hover:bg-[#eef5da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              >
                {content}
              </Link>
            ) : (
              <div key={row.participantId} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function PlayerLinksPanel({
  signals,
}: {
  signals: ReturnType<typeof buildTournamentPlayerSignals>;
}) {
  if (signals.length === 0) return null;

  return (
    <Card className={`${tournamentCardClass} p-4 sm:p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Golf Sheet link</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Player form
          </h2>
        </div>
        <Activity className="h-5 w-5 text-primary" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => (
          <Link
            key={signal.participantId}
            href={signal.profileHref}
            className="group rounded-md border border-border bg-secondary p-3 transition hover:border-primary/70 hover:bg-[#eef5da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4"
          >
            <div className="flex items-center gap-3">
              {signal.image ? (
                <Image
                  src={signal.image}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#123524] text-[#fffaf0]">
                  <Users className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1 font-semibold">
                  <span className="truncate">{signal.displayName}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {signal.teamName ?? signal.nickname ?? "Linked player"}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
              <MiniMetric label="Recent" value={formatSignedDecimal(signal.recentAvgVsPar)} />
              <MiniMetric label="Best" value={formatSignedDecimal(signal.bestDifferential)} />
              <MiniMetric label="Rounds" value={signal.linkedRoundCount} />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              HCP {formatDecimal(signal.handicapSnapshot)}
              {signal.lastRoundDate ? ` · Last ${formatShortDate(signal.lastRoundDate)}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function TeamLeaderboardCard({
  rows,
}: {
  rows: ReturnType<typeof buildTeamLeaderboard>;
}) {
  return (
    <Card className={`${tournamentCardClass} p-4 sm:p-5`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Team total</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl">Teams</h2>
        </div>
        <Shield className="h-5 w-5 text-primary" />
      </div>
      {rows.length === 0 ? (
        <EmptyLine text="No teams yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.teamId} className="rounded-md border border-border bg-secondary p-3">
              <div className="flex items-center gap-3">
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
                <div className="shrink-0 text-right">
                  <div className="number-mono text-lg font-semibold sm:text-xl">{formatNumber(row.netTotal)}</div>
                  <div className="text-xs text-muted-foreground">net</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
                <MiniMetric label="HCP" value={formatDecimal(row.combinedHandicap)} />
                <MiniMetric label="Wins" value={row.teamWins} />
                <MiniMetric label="Form" value={formatSignedDecimal(row.recentAvgVsPar)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TeamsPanel({
  edition,
  rows,
}: {
  edition: TournamentEditionFull;
  rows: ReturnType<typeof buildTeamLeaderboard>;
}) {
  const rowById = new Map(rows.map((row) => [row.teamId, row]));

  return (
    <Card id="teams" className={`${tournamentCardClass} scroll-mt-28 p-4 sm:p-5`}>
      <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Team room</h2>
      <div className="mt-5 grid gap-3">
        {edition.teams.length === 0 ? (
          <EmptyLine text="No teams have been assigned." />
        ) : (
          edition.teams.map((team) => {
            const stats = rowById.get(team.id);

            return (
              <div key={team.id} className="rounded-md border border-border bg-secondary p-3 sm:p-4">
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
                  <h3 className="min-w-0 truncate text-lg font-semibold">{team.name}</h3>
                </div>
                {stats && (
                  <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                    <MiniMetric label="Combined HCP" value={formatDecimal(stats.combinedHandicap)} />
                    <MiniMetric label="Avg HCP" value={formatDecimal(stats.averageHandicap)} />
                    <MiniMetric label="Team wins" value={stats.teamWins} />
                    <MiniMetric label="Solo wins" value={stats.individualWins} />
                    <MiniMetric
                      label="Linked"
                      value={`${stats.linkedMemberCount}/${stats.memberCount}`}
                    />
                    <MiniMetric label="App rounds" value={stats.linkedRoundCount} />
                    <MiniMetric
                      label="Recent form"
                      value={formatSignedDecimal(stats.recentAvgVsPar)}
                    />
                    <MiniMetric
                      label="Best diff"
                      value={formatSignedDecimal(stats.bestDifferential)}
                    />
                  </div>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {team.members.map((member) => (
                    <TeamMemberLink key={member.id} member={member} />
                  ))}
                </div>
                {team.description && (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{team.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function TeamMemberLink({
  member,
}: {
  member: TournamentEditionFull["teams"][number]["members"][number];
}) {
  const avatar = member.participant.image ? (
    <Image
      src={member.participant.image}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-full object-cover"
    />
  ) : (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
      <Users className="h-4 w-4" />
    </div>
  );
  const content = (
    <>
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{member.participant.displayName}</span>
        <span className="block text-xs text-muted-foreground">
          HCP {formatDecimal(member.participant.handicapSnapshot)} ·{" "}
          {member.participant.user?._count.rounds ?? 0} rounds
        </span>
      </span>
      {member.participant.userId && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </>
  );
  const className =
    "flex min-h-12 items-center gap-2 rounded-md bg-card px-3 py-2 text-sm transition";

  return member.participant.userId ? (
    <Link
      href={`/players/${member.participant.userId}`}
      className={`${className} hover:bg-[#eef5da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function SchedulePanel({ edition }: { edition: TournamentEditionFull }) {
  const grouped = new Map<string, typeof edition.schedule>();
  for (const item of edition.schedule) {
    grouped.set(item.dayLabel, [...(grouped.get(item.dayLabel) ?? []), item]);
  }

  return (
    <Card className={`${tournamentCardClass} p-4 sm:p-5`}>
      <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Weekend schedule</h2>
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
    <Card id="players" className={`${tournamentCardClass} scroll-mt-28 p-4 sm:p-5`}>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Field</p>
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl">Players</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {edition.participants.map((participant) => {
          const row = rowById.get(participant.id);
          const content = (
            <>
              {participant.image ? (
                <div className="relative h-44 sm:h-52">
                  <Image
                    src={participant.image}
                    alt={participant.displayName}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-44 place-items-center bg-primary/10 text-primary sm:h-52">
                  <Users className="h-8 w-8" />
                </div>
              )}
              <div className="p-3 sm:p-4">
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
                {participant.userId && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
                    View Golf Sheet stats <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:gap-2">
                  <MiniMetric label="Net" value={formatNumber(row?.netTotal ?? null)} />
                  <MiniMetric label="Scores" value={row?.scoreCount ?? 0} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
                  <MiniMetric label="Solo wins" value={participant.individualWins} />
                  <MiniMetric label="Team wins" value={participant.teamWins} />
                </div>
                {participant.bio && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {participant.bio}
                  </p>
                )}
              </div>
            </>
          );
          const className =
            "group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition";

          return participant.userId ? (
            <Link
              key={participant.id}
              href={`/players/${participant.userId}`}
              className={`${className} hover:border-primary/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              {content}
            </Link>
          ) : (
            <div key={participant.id} className={className}>
              {content}
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
    <section id="course-guide" className="scroll-mt-28 space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Course guide</p>
        <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Scout the trouble
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {edition.courses.map((entry) => {
          const guide = guides.find((item) => item.courseName === entry.course.name);
          const teeTime = getTournamentCourseTeeTime(edition, entry.dayLabel);
          return (
            <Card key={entry.id} className={`${tournamentCardClass} overflow-hidden p-0`}>
              <div className="relative h-48 bg-secondary sm:h-56">
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
                  <h3 className="font-serif text-2xl font-bold tracking-tight text-[#fffaf0] sm:text-3xl">
                    {entry.course.name}
                  </h3>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {guide?.summary ?? entry.notes ?? "Tournament course details coming soon."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
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
    <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5">
      <div className="flex snap-x snap-mandatory gap-3">
        {Array.from({ length: 18 }, (_, index) => index + 1).map((hole) => (
          <div
            key={`${courseName}-${hole}`}
            className="w-[78vw] shrink-0 snap-start overflow-hidden rounded-md border border-border bg-card sm:w-56"
          >
            <div className="relative h-64 sm:h-72">
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
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <Card className={`${tournamentCardClass} p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground sm:gap-2 sm:text-xs">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="number-mono mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl">{value}</div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-secondary p-2">
      <div className="truncate text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
        {label}
      </div>
      <div className="number-mono mt-1 truncate text-sm font-semibold sm:text-base">{value}</div>
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

function formatDecimal(value: number | null | undefined) {
  if (value == null) return "-";
  return Number.isInteger(value) ? value : value.toFixed(1);
}

function formatSignedDecimal(value: number | null | undefined) {
  if (value == null) return "-";
  const formatted = formatDecimal(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(date);
}
