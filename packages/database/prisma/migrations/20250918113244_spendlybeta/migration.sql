/*
  Warnings:

  - You are about to drop the column `type` on the `Alert` table. All the data in the column will be lost.
  - You are about to alter the column `threshold` on the `Alert` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `endpoint` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Alert_userId_type_key";

-- AlterTable
ALTER TABLE "public"."Alert" DROP COLUMN "type",
ADD COLUMN     "apiKeyId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationMethod" TEXT NOT NULL DEFAULT 'email',
ALTER COLUMN "threshold" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."Usage" ADD COLUMN     "endpoint" TEXT NOT NULL,
ADD COLUMN     "inputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modelUsed" TEXT,
ADD COLUMN     "outputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "requests" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "totalTokens" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "subscriptionEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
