# Web Dockerfile
FROM node:22-alpine

# Install pnpm and curl
RUN npm install -g pnpm && \
    apk add --no-cache curl

WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and config files
COPY apps/web ./apps/web
COPY packages ./packages
COPY biome.json ./

# Build the application
WORKDIR /app/apps/web

# Clean any existing build artifacts and caches
RUN rm -rf .output .tanstack .vite dist node_modules/.vite node_modules/.cache

# Accept build arguments
ARG VITE_API_URL
ARG VITE_APP_URL

# Set as environment variables (available during build)
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV NODE_ENV=production
ENV VITE_BUILD_TARGET=production

# Ensure clean, deterministic build with increased memory for Nitro bundling
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build && \
    echo "Build completed. Checking output..." && \
    ls -la .output/ && \
    ls -la .output/server/ && \
    test -f .output/server/index.mjs || (echo "ERROR: .output/server/index.mjs not found!" && exit 1)

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
