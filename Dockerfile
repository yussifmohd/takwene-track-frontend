# syntax=docker/dockerfile:1

# ---- build ----
FROM node:26.13.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- runtime: non-root nginx (uid 101) on 8081 ----
FROM nginxinc/nginx-unprivileged:1.30.6-alpine AS runtime
ENV API_UPSTREAM=http://api:8080 \
    NGINX_RESOLVER=127.0.0.11
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8081/ > /dev/null || exit 1
