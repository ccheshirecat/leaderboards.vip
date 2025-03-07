-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "casino" TEXT NOT NULL,
    "apiConfig" JSONB NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "casinoPlayerId" TEXT,
    "casino" TEXT,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT,
    "referredBy" TEXT,
    "referralCode" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "casinoPlayerId" TEXT NOT NULL,
    "casino" TEXT NOT NULL,
    "wagerAmount" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "casino" TEXT NOT NULL,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaderboardConfig" JSONB NOT NULL DEFAULT '{}',
    "data" JSONB NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_createdAt_idx" ON "Tenant"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE INDEX "User_referredBy_idx" ON "User"("referredBy");

-- CreateIndex
CREATE INDEX "User_casinoPlayerId_casino_idx" ON "User"("casinoPlayerId", "casino");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_casinoPlayerId_casino_key" ON "User"("tenantId", "casinoPlayerId", "casino");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_tenantId_timestamp_idx" ON "LeaderboardEntry"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_casinoPlayerId_casino_idx" ON "LeaderboardEntry"("casinoPlayerId", "casino");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_tenantId_casinoPlayerId_casino_timestamp_key" ON "LeaderboardEntry"("tenantId", "casinoPlayerId", "casino", "timestamp");

-- CreateIndex
CREATE INDEX "Leaderboard_tenantId_casino_idx" ON "Leaderboard"("tenantId", "casino");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_tenantId_casino_key" ON "Leaderboard"("tenantId", "casino");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
