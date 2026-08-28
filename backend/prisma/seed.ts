import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("payjoy123");

  const user = await prisma.user.upsert({
    where: { email: "pablo.gavilanes@payjoy.demo" },
    update: {},
    create: {
      name: "Pablo Gavilanes",
      email: "pablo.gavilanes@payjoy.demo",
      passwordHash,
      role: "SUPERADMIN",
    },
  });

  // No se siembra KioskMeta de ejemplo: el ware_code "007" usado antes
  // como demo coincide con una bodega real que ya devuelve la API
  // (Novisuite), y la metadata inventada (supervisor/contacto ficticios)
  // terminaba mostrandose pegada a esa bodega real en "Bodegas cercanas"
  // como si fuera dato verdadero. KioskMeta debe poblarse solo con datos
  // reales de bodegas reales cuando existan, no con datos de ejemplo.

  console.log("Seed listo. Usuario demo:", user.email, "/ password: payjoy123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
