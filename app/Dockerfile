# ── Stage 1: Build the Vite static SPA ──────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
# Pass App Insights connection string at build time (optional; no-op if absent)
ARG VITE_APPINSIGHTS_CONNECTION_STRING=""
ENV VITE_APPINSIGHTS_CONNECTION_STRING=$VITE_APPINSIGHTS_CONNECTION_STRING
RUN npm run build

# ── Stage 2: Serve static files with nginx ─────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback: route all unknown paths to index.html
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
  location ~* \\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {\n\
    expires 7d;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
