-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "excludeFromStats" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PendingRound" ADD COLUMN     "excludeFromStats" BOOLEAN NOT NULL DEFAULT false;

