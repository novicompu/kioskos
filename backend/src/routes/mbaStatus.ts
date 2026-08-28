import type { FastifyInstance } from "fastify";
import { getCachedMbaStatus } from "../lib/mbaStatus.js";

export async function mbaStatusRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Devuelve el ultimo estado conocido (se hace polling en background,
  // ver lib/mbaStatus.ts) -- nunca golpea la API externa en la request.
  app.get("/api/mba-status", async () => getCachedMbaStatus());
}
