import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const updateSettingsSchema = z.object({
  allowManualLocation: z.boolean(),
});

async function getOrCreateSettings() {
  return prisma.systemSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });
}

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Cualquier usuario autenticado puede leerla (decide si el frontend
  // muestra la opcion de ubicacion manual).
  app.get("/api/settings", async () => {
    const settings = await getOrCreateSettings();
    return { status: "success", settings: { allowManualLocation: settings.allowManualLocation } };
  });

  app.patch(
    "/api/admin/settings",
    { preHandler: app.requireRole(["SUPERADMIN"]) },
    async (request, reply) => {
      const parsed = updateSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ status: "error", message: "Datos invalidos" });
      }

      await getOrCreateSettings();
      const settings = await prisma.systemSettings.update({
        where: { id: "global" },
        data: { allowManualLocation: parsed.data.allowManualLocation },
      });

      return { status: "success", settings: { allowManualLocation: settings.allowManualLocation } };
    },
  );
}
