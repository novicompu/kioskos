import { randomBytes, createHash } from "node:crypto";
import { prisma } from "./prisma.js";
import { env } from "./env.js";
import { sendMail } from "./mail.js";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Crea un token de reseteo/invitacion y devuelve la URL para incluir en el correo. */
export async function createPasswordResetLink(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return `${env.frontendOrigin}/reset-password?token=${rawToken}`;
}

interface Logger {
  info: (msg: string) => void;
  error: (msg: string, err?: unknown) => void;
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
  logger: Logger,
): Promise<void> {
  await sendMail(
    {
      to,
      subject: "Recupera tu contraseña — Kiosko",
      text: `Hola ${name},\n\nSolicitaste restablecer tu contraseña. Abre este enlace (valido por 30 minutos):\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.`,
      html: `<p>Hola ${name},</p><p>Solicitaste restablecer tu contraseña. Abre este enlace (válido por 30 minutos):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no fuiste tú, ignora este correo.</p>`,
    },
    logger,
  );
}

export async function sendInvitationEmail(
  to: string,
  name: string,
  setPasswordUrl: string,
  logger: Logger,
): Promise<void> {
  await sendMail(
    {
      to,
      subject: "Te invitaron al Kiosko — crea tu contraseña",
      text: `Hola ${name},\n\nSe creó una cuenta para ti en el Kiosko. Crea tu contraseña aquí (válido por 30 minutos):\n${setPasswordUrl}`,
      html: `<p>Hola ${name},</p><p>Se creó una cuenta para ti en el Kiosko. Crea tu contraseña aquí (válido por 30 minutos):</p><p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p>`,
    },
    logger,
  );
}
