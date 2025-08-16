-- CreateTable
CREATE TABLE "CompanyDetails" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalForm" TEXT,
    "inn" TEXT NOT NULL,
    "kpp" TEXT,
    "ogrn" TEXT,
    "legalAddress" TEXT NOT NULL,
    "postalAddress" TEXT,
    "bankName" TEXT NOT NULL,
    "bik" TEXT NOT NULL,
    "correspondentAccount" TEXT,
    "settlementAccount" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "directorName" TEXT NOT NULL,
    "directorPosition" TEXT NOT NULL DEFAULT 'Генеральный директор',
    "directorBasis" TEXT NOT NULL DEFAULT 'Устава',
    "taxSystem" TEXT,
    "okpo" TEXT,
    "oktmo" TEXT,
    "okved" TEXT,
    "tbankUrl" TEXT DEFAULT 'https://026401027275.tb.ru',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDetails_inn_key" ON "CompanyDetails"("inn");