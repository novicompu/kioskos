import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { env } from "./lib/env.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { kioskRoutes } from "./routes/kiosks.js";
import { mbaStatusRoutes } from "./routes/mbaStatus.js";
import { startMbaStatusPolling } from "./lib/mbaStatus.js";
import { adminUsersRoutes } from "./routes/adminUsers.js";
import { settingsRoutes } from "./routes/settings.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.isProduction ? "info" : "debug",
      transport: env.isProduction
        ? undefined
        : { target: "pino-pretty", options: { colorize: true } },
    },
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: env.frontendOrigin,
    credentials: true,
  });
  await app.register(cookie, { secret: env.cookieSecret });
  await app.register(jwt, {
    secret: env.jwtSecret,
    cookie: { cookieName: "token", signed: false },
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  await app.register(authPlugin);

  app.get("/api/health", async () => ({ status: "success", message: "ok" }));

  await app.register(authRoutes);
  await app.register(catalogRoutes);
  await app.register(kioskRoutes);
  await app.register(mbaStatusRoutes);
  await app.register(adminUsersRoutes);
  await app.register(settingsRoutes);

  startMbaStatusPolling();

  // Rate limit mas estricto para endpoints sensibles de auth.
  app.addHook("onRoute", (routeOptions) => {
    if (
      routeOptions.url === "/api/auth/login" ||
      routeOptions.url === "/api/auth/forgot-password"
    ) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: { max: 10, timeWindow: "1 minute" },
      };
    }
  });

  return app;
}

buildServer()
  .then((app) => app.listen({ port: env.port, host: "0.0.0.0" }))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
