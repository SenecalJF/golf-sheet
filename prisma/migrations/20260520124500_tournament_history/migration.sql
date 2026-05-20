-- CreateEnum
CREATE TYPE "TournamentHonorType" AS ENUM ('INDIVIDUAL_CHAMPION', 'TEAM_CHAMPION');

-- AlterTable
ALTER TABLE "TournamentParticipant" ADD COLUMN     "individualWins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamWins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TournamentTeam" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "TournamentHonor" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "editionId" TEXT,
    "year" INTEGER,
    "type" "TournamentHonorType" NOT NULL,
    "title" TEXT NOT NULL,
    "participantId" TEXT,
    "teamId" TEXT,
    "participantName" TEXT,
    "teamName" TEXT,
    "notes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentHonor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentHonor_seriesId_year_idx" ON "TournamentHonor"("seriesId", "year");

-- CreateIndex
CREATE INDEX "TournamentHonor_editionId_idx" ON "TournamentHonor"("editionId");

-- CreateIndex
CREATE INDEX "TournamentHonor_participantId_idx" ON "TournamentHonor"("participantId");

-- CreateIndex
CREATE INDEX "TournamentHonor_teamId_idx" ON "TournamentHonor"("teamId");

-- AddForeignKey
ALTER TABLE "TournamentHonor" ADD CONSTRAINT "TournamentHonor_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "TournamentSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentHonor" ADD CONSTRAINT "TournamentHonor_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentHonor" ADD CONSTRAINT "TournamentHonor_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentHonor" ADD CONSTRAINT "TournamentHonor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
