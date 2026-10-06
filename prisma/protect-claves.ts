import { PrismaClient } from "@prisma/client";
import {
  encryptClave,
  isBcryptClave,
  isEncryptedClave,
} from "../src/lib/clave-crypto";

const prisma = new PrismaClient();

async function main() {
  const people = await prisma.person.findMany({
    where: { clave: { not: null } },
    select: { id: true, clave: true },
  });

  let encrypted = 0;
  let already = 0;
  let legacy = 0;

  for (const person of people) {
    const clave = person.clave;
    if (!clave) continue;

    if (isEncryptedClave(clave)) {
      already++;
      continue;
    }

    if (isBcryptClave(clave)) {
      legacy++;
      continue;
    }

    await prisma.person.update({
      where: { id: person.id },
      data: { clave: encryptClave(clave) },
    });
    encrypted++;
  }

  console.log(
    `Claves encriptadas: ${encrypted}. Ya encriptadas: ${already}. Irrecuperables (hash legado): ${legacy}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
