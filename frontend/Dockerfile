# Build context = raiz del monorepo (npm workspaces). En Dokploy: Docker
# Build Path "/", Dockerfile Path "frontend/Dockerfile".

# node:20-slim (glibc) en vez de alpine: Vite usa Rolldown, cuyo binario
# nativo no tiene build para musl (Alpine) en esta version.
FROM node:20-slim AS deps
WORKDIR /repo
COPY package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
# Sin package-lock.json a proposito: el que esta en el repo se genero en
# Windows y "congela" la resolucion de los binarios opcionales de
# Rolldown de forma que ni "npm install" (con el lockfile presente)
# termina trayendo @rolldown/binding-linux-x64-gnu. Resolviendo sin
# lockfile, npm si lo instala para la plataforma real del contenedor.
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build --workspace frontend

FROM nginx:1.27-alpine AS runner
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
