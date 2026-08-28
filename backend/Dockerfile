# Build context = raiz del monorepo (npm workspaces). En Dokploy: Docker
# Build Path "/", Dockerfile Path "backend/Dockerfile".

FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /repo
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npm run build --workspace backend

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /repo/backend
ENV NODE_ENV=production
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/backend/prisma ./prisma
COPY backend/package.json ./package.json

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
