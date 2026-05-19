import { NewRoundFlow } from "@/components/rounds/new-round-flow";
import { requireUser } from "@/lib/auth-utils";
import { getCoursesForNewRound, getShareableUsers } from "@/lib/data";
import { getAnthropicKeyStatus } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";

export default async function NewRoundPage() {
  const user = await requireUser();
  const [courses, keyStatus, shareableUsers] = await Promise.all([
    getCoursesForNewRound(),
    getAnthropicKeyStatus(user.id),
    getShareableUsers(user.id),
  ]);
  return (
    <NewRoundFlow
      courses={courses}
      aiEnabled={keyStatus.configured}
      shareableUsers={shareableUsers}
    />
  );
}
