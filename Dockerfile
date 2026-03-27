# --- Stage 1: Build & Prune ---
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Runtime dependencies
RUN apk add --no-cache openssl libstdc++

# Security: Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production \
    PORT=5000

# Copy ONLY strictly necessary artifacts
# Copy artifacts
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/server/fonts ./server/fonts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Setup directories and permissions
RUN chmod +x entrypoint.sh && \
    mkdir -p public/uploads server/data && \
    chown -R nextjs:nodejs public/uploads server/data

# Copy fallback certificate ONLY if it exists in the builder
RUN if [ -f /app/server/data/certificate.pdf ]; then \
        cp /app/server/data/certificate.pdf ./dist/certificate.pdf && \
        chown nextjs:nodejs ./dist/certificate.pdf; \
    fi

USER nextjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:5000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
