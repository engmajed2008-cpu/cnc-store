# ─────────────────────────────────────────────────────────────
# Stage 1 — Dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
LABEL stage="deps"

# Install libc for native modules (sharp, etc.)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files only — leverage Docker layer cache
COPY package.json package-lock.json* ./

# Clean install — ci is faster and reproducible
RUN npm ci --frozen-lockfile

# ─────────────────────────────────────────────────────────────
# Stage 2 — Builder
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build-time environment variables
# Override in docker-compose.yml or CI/CD pipeline
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js app (outputs to .next/standalone)
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3 — Runner (minimal production image)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what Next.js standalone needs
COPY --from=builder /app/public          ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static    ./.next/static

# Fix ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Runtime environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
