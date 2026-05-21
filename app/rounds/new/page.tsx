import { NewRoundFlow } from "@/components/rounds/new-round-flow";
import { requireUser } from "@/lib/auth-utils";
import { getCoursesForNewRound, getShareableUsers } from "@/lib/data";
import { getTournamentRoundSubmitContext } from "@/lib/tournaments";
import { getAnthropicKeyStatus } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";

export default async function NewRoundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const tournamentEditionId = firstParam(params.tournamentEditionId);
  const [courses, keyStatus, shareableUsers, tournamentContext] = await Promise.all([
    getCoursesForNewRound(),
    getAnthropicKeyStatus(user.id),
    getShareableUsers(user.id),
    tournamentEditionId
      ? getTournamentRoundSubmitContext(tournamentEditionId, user.id)
      : Promise.resolve(null),
  ]);
  return (
    <NewRoundFlow
      courses={courses}
      aiEnabled={keyStatus.configured}
      shareableUsers={shareableUsers}
      tournamentContext={tournamentContext}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
