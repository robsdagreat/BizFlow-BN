/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicUrl` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "publicUrl" TEXT NOT NULL,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
