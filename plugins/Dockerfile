# Insta VIZ plugins app — production image for Cloud Run.
# Build from inside plugins/:  docker build --build-arg NEXT_PUBLIC_EXTRACT_TOKEN=... -t instaviz-api .

# ── 1. install dependencies ───────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. build ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Browser pages read this at BUILD time (NEXT_PUBLIC_*), so it must be passed here.
ARG NEXT_PUBLIC_EXTRACT_TOKEN
ENV NEXT_PUBLIC_EXTRACT_TOKEN=$NEXT_PUBLIC_EXTRACT_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. run ────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 8080
CMD ["node", "server.js"]
