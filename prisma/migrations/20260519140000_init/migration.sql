-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "country" TEXT NOT NULL DEFAULT 'Canada',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tee" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "rating" DOUBLE PRECISION,
    "slope" INTEGER,
    "yardage" INTEGER,
    "pars" TEXT NOT NULL,
    "holeCount" INTEGER NOT NULL DEFAULT 18,
    "rating9F" DOUBLE PRECISION,
    "slope9F" INTEGER,
    "rating9B" DOUBLE PRECISION,
    "slope9B" INTEGER,

    CONSTRAINT "Tee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teeId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoleScore" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "strokes" INTEGER NOT NULL,
    "putts" INTEGER,
    "fairwayHit" BOOLEAN,
    "gir" BOOLEAN,
    "confidence" DOUBLE PRECISION,
    "illegible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HoleScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tee_courseId_name_key" ON "Tee"("courseId", "name");

-- CreateIndex
CREATE INDEX "Round_date_idx" ON "Round"("date");

-- CreateIndex
CREATE INDEX "Round_courseId_idx" ON "Round"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "HoleScore_roundId_holeNumber_key" ON "HoleScore"("roundId", "holeNumber");

-- AddForeignKey
ALTER TABLE "Tee" ADD CONSTRAINT "Tee_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "Tee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleScore" ADD CONSTRAINT "HoleScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

