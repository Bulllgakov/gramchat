-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;
