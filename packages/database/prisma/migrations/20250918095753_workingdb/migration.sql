/*
  Warnings:

  - Added the required column `name` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Alert" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "thresholdType" TEXT NOT NULL DEFAULT 'cost';

-- AlterTable
ALTER TABLE "public"."ApiKey" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
