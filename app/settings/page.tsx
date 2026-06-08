import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-utils";
import { getAnthropicKeyStatus } from "@/lib/user-secrets";
import { AccountSettings } from "@/components/settings/account-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [keyStatus, courseCount, roundCount] = await Promise.all([
    getAnthropicKeyStatus(user.id),
    prisma.course.count(),
    prisma.round.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-primary">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Configuration</h1>
      </div>

      <AccountSettings
        user={{ name: user.name, email: user.email }}
        keyStatus={keyStatus}
        courseCount={courseCount}
        roundCount={roundCount}
      />
    </div>
  );
}
