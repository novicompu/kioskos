import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getProducts, NovisuiteApiError } from "../integrations/novisuite.js";
import { prisma } from "../lib/prisma.js";
import { nonBlank } from "../lib/text.js";

const coordsSchema = z.object({
  lat: z.coerce.number(),
  long: z.coerce.number(),
});

export async function kioskRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/api/kiosks", async (request, reply) => {
    const parsed = coordsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "lat y long son requeridos" });
    }

    let novisuite;
    try {
      // El endpoint de productos ya resuelve, via poligono de cobertura,
      // que bodega(s) cubren la coordenada enviada -- lo reutilizamos aqui
      // solo por su lista de `warehouses` (puede haber mas de una).
      novisuite = await getProducts(parsed.data.lat, parsed.data.long);
    } catch (err) {
      if (err instanceof NovisuiteApiError) {
        return reply.code(err.statusCode).send({ status: "error", message: err.message });
      }
      throw err;
    }

    const wareCodes = novisuite.warehouses.map((w) => w.ware_code);
    const metas = wareCodes.length
      ? await prisma.kioskMeta.findMany({ where: { wareCode: { in: wareCodes } } })
      : [];
    const metaByCode = new Map(metas.map((m) => [m.wareCode, m]));

    const kiosks = novisuite.warehouses.map((warehouse) => {
      const meta = metaByCode.get(warehouse.ware_code);
      return {
        wareCode: warehouse.ware_code,
        wareName: warehouse.ware_name,
        friendlyName: warehouse.friendly_name,
        displayName: meta?.displayName ?? warehouse.friendly_name,
        // "Supervisor" no tiene equivalente en la API (es informacion
        // propia, no de la bodega) -- solo sale de KioskMeta si algun dia
        // se carga manualmente.
        supervisor: nonBlank(meta?.supervisor),
        // El resto: la API es la fuente principal (mas fresca y ya viene
        // por bodega); KioskMeta queda como respaldo/override manual para
        // cuando la API todavia no la tenga.
        address: nonBlank(warehouse.contact_location) ?? nonBlank(meta?.address),
        contactName: nonBlank(warehouse.administrator_name) ?? nonBlank(meta?.contactName),
        contactPhone: nonBlank(warehouse.contact_phone) ?? nonBlank(meta?.contactPhone),
      };
    });

    return { status: "success", available: novisuite.available, kiosks };
  });
}
