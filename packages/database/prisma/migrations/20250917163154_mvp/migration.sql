/*
  Warnings:

  - You are about to drop the column `apiKeyId` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `notificationMethod` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `thresholdType` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `endpoint` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `requests` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `tokens` on the `Usage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,type]` on the table `Alert` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTokens` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_apiKeyId_fkey";

-- AlterTable
ALTER TABLE "public"."Alert" DROP COLUMN "apiKeyId",
DROP COLUMN "isActive",
DROP COLUMN "name",
DROP COLUMN "notificationMethod",
DROP COLUMN "period",
DROP COLUMN "thresholdType",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "threshold" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."ApiKey" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "public"."Usage" DROP COLUMN "endpoint",
DROP COLUMN "provider",
DROP COLUMN "requests",
DROP COLUMN "tokens",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "mostExpensiveEndpoint" TEXT,
ADD COLUMN     "totalTokens" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_type_key" ON "public"."Alert"("userId", "type");
