# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Run ----------
# nginx non-root (écoute sur 8080). Le fichier .template est transformé au démarrage
# (variables d'environnement substituées) en /etc/nginx/conf.d/default.conf.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/service-management-frontend/browser /usr/share/nginx/html

# Adresse du backend vue depuis le conteneur (nom du service dans docker-compose).
ENV BACKEND_URL=http://backend:8080
EXPOSE 8080
