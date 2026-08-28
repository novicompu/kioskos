import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { hashToken, createPasswordResetLink, sendPasswordResetEmail } from "../lib/passwordReset.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(120),
  email: z.string().trim().email("Correo invalido"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "Datos invalidos" });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ status: "error", message: "Credenciales invalidas" });
    }

    const passwordOk = await argon2.verify(user.passwordHash, password);
    if (!passwordOk) {
      return reply.code(401).send({ status: "error", message: "Credenciales invalidas" });
    }

    const token = app.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: "8h" },
    );

    reply.setCookie("token", token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return {
      status: "success",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  app.post("/api/auth/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return { status: "success" };
  });

  app.get("/api/auth/me", { preHandler: app.authenticate }, async (request, reply) => {
    const payload = request.user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return reply.code(401).send({ status: "error", message: "No autenticado" });
    }
    return {
      status: "success",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  // "Actualizar datos": el propio usuario edita su nombre/correo.
  app.patch("/api/auth/me", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: parsed.error.issues[0]?.message ?? "Datos invalidos" });
    }

    const payload = request.user as { sub: string };
    const { name, email } = parsed.data;

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: payload.sub } },
    });
    if (emailTaken) {
      return reply.code(409).send({ status: "error", message: "Ese correo ya está en uso" });
    }

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: { name, email },
    });

    return {
      status: "success",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  // Cambio de contraseña estando logueado (requiere la contraseña actual).
  app.post("/api/auth/change-password", { preHandler: app.authenticate }, async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: parsed.error.issues[0]?.message ?? "Datos invalidos" });
    }

    const payload = request.user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return reply.code(401).send({ status: "error", message: "No autenticado" });
    }

    const currentOk = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
    if (!currentOk) {
      return reply.code(401).send({ status: "error", message: "Contraseña actual incorrecta" });
    }

    const passwordHash = await argon2.hash(parsed.data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { status: "success", message: "Contraseña actualizada" };
  });

  app.post("/api/auth/forgot-password", async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: "Email invalido" });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    // Respuesta generica siempre (no revelar si el email existe).
    if (user) {
      const resetUrl = await createPasswordResetLink(user.id);
      await sendPasswordResetEmail(user.email, user.name, resetUrl, app.log);
    }

    return {
      status: "success",
      message: "Si el correo existe, se enviaron instrucciones de recuperacion.",
    };
  });

  app.post("/api/auth/reset-password", async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "error", message: parsed.error.issues[0]?.message ?? "Datos invalidos" });
    }

    const tokenHash = hashToken(parsed.data.token);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return reply.code(400).send({ status: "error", message: "Token invalido o expirado" });
    }

    const passwordHash = await argon2.hash(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return { status: "success", message: "Contraseña actualizada" };
  });
}
