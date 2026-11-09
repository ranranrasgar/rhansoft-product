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
ARG VITE_API_BASE=""
ARG VITE_GOOGLE_CLIENT_ID="456401864985-if66ro8vpmfoc4sat2d1nvnrt7vca73c.apps.googleusercontent.com"
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ── Stage 2: Serve static files with nginx & proxy /api ─────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
