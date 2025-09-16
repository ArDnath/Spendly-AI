/*
  Warnings:

  - You are about to drop the column `frequency` on the `Alert` table. All the data in the column will be lost.
  - You are about to alter the column `threshold` on the `Alert` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `apiService` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `inputTokens` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `modelUsed` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `outputTokens` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Usage` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `APIKey` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `notificationMethod` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thresholdType` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endpoint` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requests` to the `Usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokens` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."APIKey" DROP CONSTRAINT "APIKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Usage" DROP CONSTRAINT "Usage_apiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Usage" DROP CONSTRAINT "Usage_userId_fkey";

-- DropIndex
DROP INDEX "public"."User_phoneNumber_key";

-- AlterTable
ALTER TABLE "public"."Alert" DROP COLUMN "frequency",
ADD COLUMN     "apiKeyId" TEXT,
ADD COLUMN     "lastNotificationSentAt" TIMESTAMP(3),
ADD COLUMN     "notificationMethod" TEXT NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL,
ADD COLUMN     "thresholdType" TEXT NOT NULL,
ALTER COLUMN "threshold" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."Usage" DROP COLUMN "apiService",
DROP COLUMN "inputTokens",
DROP COLUMN "modelUsed",
DROP COLUMN "outputTokens",
DROP COLUMN "timestamp",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endpoint" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "requests" INTEGER NOT NULL,
ADD COLUMN     "tokens" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
DROP COLUMN "phoneNumber",
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'Free';

-- DropTable
DROP TABLE "public"."APIKey";

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usage" ADD CONSTRAINT "Usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
