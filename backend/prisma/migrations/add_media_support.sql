-- Add media support fields to Message table
ALTER TABLE "Message" 
ADD COLUMN "fileUrl" TEXT,
ADD COLUMN "fileName" TEXT,
ADD COLUMN "fileSize" INTEGER,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "thumbnailUrl" TEXT;