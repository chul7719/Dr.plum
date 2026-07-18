-- AlterTable: replace relative etaMinutes + date-only scheduledDate with a single
-- absolute scheduledAt (date + time). Existing rows are backfilled from scheduledDate
-- (time portion defaults to midnight) since etaMinutes had no fixed reference point.
ALTER TABLE "Quote" ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Quote" SET "scheduledAt" = "scheduledDate";

ALTER TABLE "Quote" DROP COLUMN "etaMinutes";
ALTER TABLE "Quote" DROP COLUMN "scheduledDate";
