# --- Stage 1: Build Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Install build essentials for native modules (better-sqlite3, sharp)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
COPY package*.json ./

# Use npm ci for faster, predictable installs and avoid ETXTBSY issues
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build frontend and backend
RUN npm run build

# --- Stage 2: Production Stage ---
FROM node:20-slim

WORKDIR /app

# Better-sqlite3 and sharp need some runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/server/data ./server/data
COPY --from=builder /app/server/fonts ./server/fonts
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/server/migrate.ts ./server/migrate.ts
COPY --from=builder /app/shared ./shared

# Ensure persistent directories exist
RUN mkdir -p public/uploads server/data

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]
