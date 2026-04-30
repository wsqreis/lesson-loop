/*
  Warnings:

  - Added the required column `joinCode` to the `ClassroomSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GrowthExperiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthExperiment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassroomSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassroomSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassroomSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassroomSession" ("createdAt", "grade", "id", "joinCode", "scheduledAt", "schoolId", "subject", "teacherId", "title") SELECT "createdAt", "grade", "id", 'JOIN' || substr("id", -6), "scheduledAt", "schoolId", "subject", "teacherId", "title" FROM "ClassroomSession";
DROP TABLE "ClassroomSession";
ALTER TABLE "new_ClassroomSession" RENAME TO "ClassroomSession";
CREATE UNIQUE INDEX "ClassroomSession_joinCode_key" ON "ClassroomSession"("joinCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
