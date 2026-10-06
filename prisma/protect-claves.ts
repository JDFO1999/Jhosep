import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

async function main() {
  const people = await prisma.person.findMany({
    where: { clave: { not: null } },
    select: { id: true, name: true, clave: true },
  });

  let migrated = 0;

  for (const person of people) {
    const clave = person.clave;
    if (!clave || BCRYPT_HASH_RE.test(clave)) continue;

    const hash = await bcrypt.hash(clave, 12);
    await prisma.person.update({
      where: { id: person.id },
      data: { clave: hash },
    });
    migrated++;
  }

  console.log(
    `Claves protegidas: ${migrated}. Ya protegidas o vacías: ${people.length - migrated}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
