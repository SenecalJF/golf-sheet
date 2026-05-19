-- CreateEnum
CREATE TYPE "PendingRoundStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "PendingRound" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teeId" TEXT,
    "acceptedRoundId" TEXT,
    "status" "PendingRoundStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "holeCount" INTEGER NOT NULL,
    "nineType" TEXT,
    "notes" TEXT,
    "weather" TEXT,
    "pcc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStrokes" INTEGER NOT NULL,
    "totalPar" INTEGER NOT NULL,
    "scoreDiff" DOUBLE PRECISION,
    "sourceImage" TEXT,
    "extractionModel" TEXT,
    "scorecardPlayerName" TEXT,
    "scorecardRowLabel" TEXT,
    "rowConfidence" DOUBLE PRECISION,
    "rowNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actedAt" TIMESTAMP(3),

    CONSTRAINT "PendingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingRoundHoleScore" (
    "id" TEXT NOT NULL,
    "pendingRoundId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "strokes" INTEGER NOT NULL,
    "putts" INTEGER,
    "confidence" DOUBLE PRECISION,
    "illegible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PendingRoundHoleScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingRound_acceptedRoundId_key" ON "PendingRound"("acceptedRoundId");

-- CreateIndex
CREATE INDEX "PendingRound_senderUserId_idx" ON "PendingRound"("senderUserId");

-- CreateIndex
CREATE INDEX "PendingRound_recipientUserId_status_idx" ON "PendingRound"("recipientUserId", "status");

-- CreateIndex
CREATE INDEX "PendingRound_status_idx" ON "PendingRound"("status");

-- CreateIndex
CREATE INDEX "PendingRound_courseId_idx" ON "PendingRound"("courseId");

-- CreateIndex
CREATE INDEX "PendingRound_teeId_idx" ON "PendingRound"("teeId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingRoundHoleScore_pendingRoundId_holeNumber_key" ON "PendingRoundHoleScore"("pendingRoundId", "holeNumber");

-- AddForeignKey
ALTER TABLE "PendingRound" ADD CONSTRAINT "PendingRound_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRound" ADD CONSTRAINT "PendingRound_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRound" ADD CONSTRAINT "PendingRound_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRound" ADD CONSTRAINT "PendingRound_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "Tee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRound" ADD CONSTRAINT "PendingRound_acceptedRoundId_fkey" FOREIGN KEY ("acceptedRoundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRoundHoleScore" ADD CONSTRAINT "PendingRoundHoleScore_pendingRoundId_fkey" FOREIGN KEY ("pendingRoundId") REFERENCES "PendingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

