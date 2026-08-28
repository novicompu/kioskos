import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getProductDetail, getProducts, NovisuiteApiError } from "../integrations/novisuite.js";

const coordsSchema = z.object({
  lat: z.coerce.number(),
  long: z.coerce.number(),
});

function handleNovisuiteError(err: unknown, reply: any) {
  if (err instanceof NovisuiteApiError) {
    return reply.code(err.statusCode).send({ status: "error", message: err.message });
  }
  throw err;
}

export async function catalogRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/api/catalog", async (request, reply) => {
    const parsed = coordsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "lat y long son requeridos" });
    }
    try {
      const data = await getProducts(parsed.data.lat, parsed.data.long);
      return data;
    } catch (err) {
      return handleNovisuiteError(err, reply);
    }
  });

  app.get<{ Params: { code: string } }>("/api/catalog/:code", async (request, reply) => {
    const parsed = coordsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "lat y long son requeridos" });
    }
    try {
      const data = await getProductDetail(request.params.code, parsed.data.lat, parsed.data.long);
      return data;
    } catch (err) {
      return handleNovisuiteError(err, reply);
    }
  });
}
