CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Administrador',
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip" TEXT,
    "mac" TEXT,
    "computer_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "people_is_deleted_idx" ON "people"("is_deleted");
CREATE INDEX "people_department_id_idx" ON "people"("department_id");
CREATE INDEX "people_name_idx" ON "people"("name");
ALTER TABLE "people" ADD CONSTRAINT "people_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
