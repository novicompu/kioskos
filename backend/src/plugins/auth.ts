import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify({ onlyCookie: true });
    } catch {
      reply.code(401).send({ status: "error", message: "No autenticado" });
    }
  });

  // Requiere que `authenticate` ya haya corrido antes (el rol viene del
  // JWT firmado en el login -- si el rol de un usuario cambia, debe
  // volver a iniciar sesion para que se refleje).
  app.decorate("requireRole", (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { role?: UserRole } | undefined;
      if (!payload?.role || !roles.includes(payload.role)) {
        reply.code(403).send({ status: "error", message: "No autorizado" });
      }
    };
  });
}

export default fp(authPlugin);
