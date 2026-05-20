import { notFound } from "next/navigation";
import {
  TitsOpenAdmin,
  type TournamentAdminDto,
  type TournamentAdminOptionsDto,
} from "@/components/tournaments/tits-open-admin";
import { requireUser } from "@/lib/auth-utils";
import {
  getTitsOpenEditionByYear,
  getTournamentAdminOptions,
  type TournamentEditionFull,
} from "@/lib/tournaments";

export const dynamic = "force-dynamic";

export default async function TitsOpenAdminPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const user = await requireUser();
  if (!user.isAdmin) notFound();

  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!Number.isInteger(year)) notFound();

  const edition = await getTitsOpenEditionByYear(year);
  if (!edition) notFound();

  const options = await getTournamentAdminOptions(edition);
  return <TitsOpenAdmin edition={toEditionDto(edition)} options={toOptionsDto(options)} />;
}

function toEditionDto(edition: TournamentEditionFull): TournamentAdminDto {
  return {
    id: edition.id,
    year: edition.year,
    title: edition.title,
    courses: edition.courses.map((entry) => ({
      id: entry.id,
      courseId: entry.courseId,
      teeId: entry.teeId,
      roundNumber: entry.roundNumber,
      dayLabel: entry.dayLabel,
      holeCount: entry.holeCount,
      notes: entry.notes,
      courseName: entry.course.name,
      teeName: entry.tee?.name ?? null,
    })),
    participants: edition.participants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      linkedUserName: participant.user?.name ?? null,
      linkedUserEmail: participant.user?.email ?? null,
      displayName: participant.displayName,
      slug: participant.slug,
      nickname: participant.nickname,
      country: participant.country,
      bio: participant.bio,
      role: participant.role,
      image: participant.image,
      handicapSnapshot: participant.handicapSnapshot,
      courseHandicapSnapshot: participant.courseHandicapSnapshot,
      individualWins: participant.individualWins,
      teamWins: participant.teamWins,
      displayOrder: participant.displayOrder,
    })),
    teams: edition.teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      logoImage: team.logoImage,
      logoAlt: team.logoAlt,
      displayOrder: team.displayOrder,
      participantIds: team.members.map((member) => member.participantId),
    })),
    schedule: edition.schedule.map((item) => ({
      id: item.id,
      dayLabel: item.dayLabel,
      timeLabel: item.timeLabel,
      title: item.title,
      details: item.details,
      displayOrder: item.displayOrder,
    })),
    scores: edition.scores.map((score) => ({
      id: score.id,
      participantId: score.participantId,
      participantName: score.participant.displayName,
      editionCourseId: score.editionCourseId,
      courseName: score.editionCourse?.course.name ?? score.round?.course.name ?? null,
      roundId: score.roundId,
      grossStrokes: score.grossStrokes,
      totalPar: score.totalPar,
      netStrokes: score.netStrokes,
      courseHandicapSnapshot: score.courseHandicapSnapshot,
    })),
  };
}

function toOptionsDto(
  options: Awaited<ReturnType<typeof getTournamentAdminOptions>>,
): TournamentAdminOptionsDto {
  return {
    courses: options.courses.map((course) => ({
      id: course.id,
      name: course.name,
      city: course.city,
      tees: course.tees.map((tee) => ({ id: tee.id, name: tee.name })),
    })),
    users: options.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
    rounds: options.rounds.map((round) => ({
      id: round.id,
      userId: round.userId,
      userName: round.user?.name ?? "Unknown player",
      courseName: round.course.name,
      date: round.date.toISOString().slice(0, 10),
      totalStrokes: round.totalStrokes,
      totalPar: round.totalPar,
    })),
  };
}
