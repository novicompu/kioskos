import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter: nodemailer.Transporter | null | undefined;

/** Lazy: solo se crea si hay SMTP configurado; null si falta configuracion. */
function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== undefined) return transporter;

  if (!env.smtp.host || !env.smtp.port || !env.smtp.user || !env.smtp.pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure, // true = TLS implicito (465); false + requireTLS = STARTTLS (587)
    requireTLS: !env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    tls: { rejectUnauthorized: env.smtp.rejectUnauthorized },
  });
  return transporter;
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envia un correo por SMTP si hay configuracion (SMTP_HOST/PORT/USER/PASS
 * en .env); si no, loguea el contenido en consola -- nunca lanza, para
 * que un fallo de correo no rompa el flujo de negocio (login sigue
 * funcionando aunque el correo de reseteo falle, por ejemplo).
 */
export async function sendMail(input: SendMailInput, logger: { info: (msg: string) => void; error: (msg: string, err?: unknown) => void }): Promise<void> {
  const client = getTransporter();

  if (!client) {
    logger.info(`[mail] SMTP no configurado. Contenido para ${input.to}:\n${input.text}`);
    return;
  }

  try {
    const info = await client.sendMail({
      from: env.smtp.from ?? env.smtp.user,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    logger.info(`[mail] Enviado a ${input.to} (messageId: ${info.messageId})`);
  } catch (err) {
    logger.error(`[mail] Fallo el envio a ${input.to}`, err);
  }
}
