import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.admin.findFirst();
  if (existing) {
    console.log("Seed already executed. Skipping.");
    return;
  }

  const hash = await bcrypt.hash("admin123", 12);

  await prisma.admin.create({
    data: {
      name: "Administrador",
      username: "admin",
      passwordHash: hash,
    },
  });

  console.log("Admin user created: admin / admin123");
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
