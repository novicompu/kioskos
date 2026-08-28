import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  jwtSecret: required("JWT_SECRET"),
  cookieSecret: required("COOKIE_SECRET"),
  payjoy: {
    baseUrl: required("PAYJOY_API_BASE_URL"),
    serviceKey: required("PAYJOY_SERVICE_KEY"),
  },
  // SMTP es opcional: si no esta configurado, el envio de correo cae a
  // loguear el mensaje en consola (ver lib/mail.ts) en vez de fallar.
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    // Por defecto se valida el certificado TLS del servidor (mas
    // seguro). Poner en "false" solo si el proveedor SMTP lo requiere
    // (equivalente a openssl_verify_mode=none).
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
  },
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
};
