-- Rework de roles: SUPERVISOR/ADMIN -> USER/ADMIN/SUPERADMIN
-- (SUPERVISOR pasa a USER; ADMIN se conserva; se agrega SUPERADMIN)
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE WHEN "role"::text = 'SUPERVISOR' THEN 'USER' ELSE "role"::text END
)::"UserRole_new";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
