import { prisma } from "@/lib/db";

export async function getParticipantUserLinkError({
  editionId,
  participantId,
  userId,
}: {
  editionId: string;
  participantId?: string;
  userId: string | null | undefined;
}) {
  if (!userId) return null;

  const [user, existingParticipant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.tournamentParticipant.findFirst({
      where: {
        editionId,
        userId,
        ...(participantId ? { id: { not: participantId } } : {}),
      },
      select: { displayName: true },
    }),
  ]);

  if (!user) return "Linked user was not found.";
  if (existingParticipant) {
    return `${user.name} is already linked to ${existingParticipant.displayName}. Unlink that participant first.`;
  }

  return null;
}
