import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createPasswordResetLink, sendInvitationEmail } from "../lib/passwordReset.js";

const roleSchema = z.enum(["USER", "ADMIN", "SUPERADMIN"]);

const createUserSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("invite"),
    name: z.string().trim().min(1, "El nombre es requerido").max(120),
    email: z.string().trim().email("Correo invalido"),
    role: roleSchema,
  }),
  z.object({
    mode: z.literal("password"),
    name: z.string().trim().min(1, "El nombre es requerido").max(120),
    email: z.string().trim().email("Correo invalido"),
    role: roleSchema,
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  }),
]);

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: roleSchema.optional(),
});

function serializeUser(user: { id: string; name: string; email: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function adminUsersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(["SUPERADMIN"]));

  app.get("/api/admin/users", async () => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return { status: "success", users: users.map(serializeUser) };
  });

  app.post("/api/admin/users", async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: parsed.error.issues[0]?.message ?? "Datos invalidos" });
    }
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return reply.code(409).send({ status: "error", message: "Ya existe un usuario con ese correo" });
    }

    if (data.mode === "password") {
      const passwordHash = await argon2.hash(data.password);
      const user = await prisma.user.create({
        data: { name: data.name, email: data.email, role: data.role, passwordHash },
      });
      return { status: "success", user: serializeUser(user), invited: false };
    }

    // Invitacion: la cuenta se crea con una contraseña aleatoria
    // inutilizable (nadie la conoce); el usuario la define al abrir el
    // enlace de invitacion, que reutiliza el mismo mecanismo de reseteo.
    const placeholderHash = await argon2.hash(randomBytes(32).toString("hex"));
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, role: data.role, passwordHash: placeholderHash },
    });

    const setPasswordUrl = await createPasswordResetLink(user.id);
    await sendInvitationEmail(user.email, user.name, setPasswordUrl, app.log);

    return { status: "success", user: serializeUser(user), invited: true };
  });

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", async (request, reply) => {
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "Datos invalidos" });
    }
    if (Object.keys(parsed.data).length === 0) {
      return reply.code(400).send({ status: "error", message: "Nada para actualizar" });
    }

    try {
      const user = await prisma.user.update({
        where: { id: request.params.id },
        data: parsed.data,
      });
      return { status: "success", user: serializeUser(user) };
    } catch {
      return reply.code(404).send({ status: "error", message: "Usuario no encontrado" });
    }
  });
}
