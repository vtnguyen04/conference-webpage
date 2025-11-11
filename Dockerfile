# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server/data ./server/data
COPY --from=builder /app/public/uploads ./public/uploads

# Copy and set the entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose the port the app runs on
EXPOSE 5000

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"]
