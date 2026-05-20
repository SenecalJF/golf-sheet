-- CreateEnum
CREATE TYPE "TournamentEditionStatus" AS ENUM ('PLANNED', 'LIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TournamentParticipantRole" AS ENUM ('PLAYER', 'CADDIE', 'GUEST');

-- CreateEnum
CREATE TYPE "TournamentScoreStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "TournamentScoreSource" AS ENUM ('MANUAL', 'LINKED_ROUND', 'AI_IMPORT');

-- CreateTable
CREATE TABLE "TournamentSeries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEdition" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "TournamentEditionStatus" NOT NULL DEFAULT 'PLANNED',
    "layoutKey" TEXT NOT NULL,
    "heroImage" TEXT,
    "logoImage" TEXT,
    "accentColor" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEditionCourse" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teeId" TEXT,
    "roundNumber" INTEGER NOT NULL DEFAULT 1,
    "dayLabel" TEXT,
    "teeTime" TIMESTAMP(3),
    "holeCount" INTEGER NOT NULL DEFAULT 18,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEditionCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nickname" TEXT,
    "country" TEXT,
    "bio" TEXT,
    "role" "TournamentParticipantRole" NOT NULL DEFAULT 'PLAYER',
    "image" TEXT,
    "handicapSnapshot" DOUBLE PRECISION,
    "courseHandicapSnapshot" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoImage" TEXT,
    "logoAlt" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentScore" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "editionCourseId" TEXT,
    "participantId" TEXT NOT NULL,
    "roundId" TEXT,
    "submittedByUserId" TEXT,
    "status" "TournamentScoreStatus" NOT NULL DEFAULT 'FINAL',
    "source" "TournamentScoreSource" NOT NULL DEFAULT 'MANUAL',
    "playedAt" TIMESTAMP(3),
    "grossStrokes" INTEGER NOT NULL,
    "totalPar" INTEGER NOT NULL,
    "handicapSnapshot" DOUBLE PRECISION,
    "courseHandicapSnapshot" INTEGER,
    "netStrokes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentScoreHole" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "strokes" INTEGER NOT NULL,
    "putts" INTEGER,

    CONSTRAINT "TournamentScoreHole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentScheduleItem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "timeLabel" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSeries_slug_key" ON "TournamentSeries"("slug");

-- CreateIndex
CREATE INDEX "TournamentEdition_year_idx" ON "TournamentEdition"("year");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEdition_seriesId_year_key" ON "TournamentEdition"("seriesId", "year");

-- CreateIndex
CREATE INDEX "TournamentEditionCourse_courseId_idx" ON "TournamentEditionCourse"("courseId");

-- CreateIndex
CREATE INDEX "TournamentEditionCourse_teeId_idx" ON "TournamentEditionCourse"("teeId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEditionCourse_editionId_roundNumber_key" ON "TournamentEditionCourse"("editionId", "roundNumber");

-- CreateIndex
CREATE INDEX "TournamentParticipant_userId_idx" ON "TournamentParticipant"("userId");

-- CreateIndex
CREATE INDEX "TournamentParticipant_editionId_displayOrder_idx" ON "TournamentParticipant"("editionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_editionId_slug_key" ON "TournamentParticipant"("editionId", "slug");

-- CreateIndex
CREATE INDEX "TournamentTeam_editionId_displayOrder_idx" ON "TournamentTeam"("editionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_editionId_name_key" ON "TournamentTeam"("editionId", "name");

-- CreateIndex
CREATE INDEX "TournamentTeamMember_teamId_displayOrder_idx" ON "TournamentTeamMember"("teamId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamMember_teamId_participantId_key" ON "TournamentTeamMember"("teamId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamMember_participantId_key" ON "TournamentTeamMember"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentScore_roundId_key" ON "TournamentScore"("roundId");

-- CreateIndex
CREATE INDEX "TournamentScore_editionId_idx" ON "TournamentScore"("editionId");

-- CreateIndex
CREATE INDEX "TournamentScore_participantId_idx" ON "TournamentScore"("participantId");

-- CreateIndex
CREATE INDEX "TournamentScore_submittedByUserId_idx" ON "TournamentScore"("submittedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentScore_editionCourseId_participantId_key" ON "TournamentScore"("editionCourseId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentScoreHole_scoreId_holeNumber_key" ON "TournamentScoreHole"("scoreId", "holeNumber");

-- CreateIndex
CREATE INDEX "TournamentScheduleItem_editionId_displayOrder_idx" ON "TournamentScheduleItem"("editionId", "displayOrder");

-- AddForeignKey
ALTER TABLE "TournamentEdition" ADD CONSTRAINT "TournamentEdition_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "TournamentSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEditionCourse" ADD CONSTRAINT "TournamentEditionCourse_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEditionCourse" ADD CONSTRAINT "TournamentEditionCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEditionCourse" ADD CONSTRAINT "TournamentEditionCourse_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "Tee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamMember" ADD CONSTRAINT "TournamentTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamMember" ADD CONSTRAINT "TournamentTeamMember_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScore" ADD CONSTRAINT "TournamentScore_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScore" ADD CONSTRAINT "TournamentScore_editionCourseId_fkey" FOREIGN KEY ("editionCourseId") REFERENCES "TournamentEditionCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScore" ADD CONSTRAINT "TournamentScore_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScore" ADD CONSTRAINT "TournamentScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScore" ADD CONSTRAINT "TournamentScore_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScoreHole" ADD CONSTRAINT "TournamentScoreHole_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "TournamentScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentScheduleItem" ADD CONSTRAINT "TournamentScheduleItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TournamentEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

