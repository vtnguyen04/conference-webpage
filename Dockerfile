# --- Stage 1: Build Stage ---
FROM node:20 AS builder

WORKDIR /app

# Install build essentials for native modules (better-sqlite3, sharp)
RUN apt-get update && apt-get install -y python3 make g++ 

COPY package*.json ./
RUN npm install

COPY . .

# Build frontend and backend
RUN npm run build

# --- Stage 2: Production Stage ---
FROM node:20-slim

WORKDIR /app

# Better-sqlite3 needs some runtime libs
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/server/data ./server/data
COPY --from=builder /app/server/fonts ./server/fonts

# Ensure upload directory exists
RUN mkdir -p public/uploads server/data

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 5000

ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]