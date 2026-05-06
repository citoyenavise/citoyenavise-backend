# D1: Multi-stage optimized build for Citoyen Avisé backend
# Stage 1: Dependencies + Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy lock files first for better caching
COPY package-lock.json package.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Runtime (production image)
FROM node:18-alpine

# Labels
LABEL maintainer="Citoyen Avisé Team"
LABEL description="Backend API pour plateforme civique Citoyen Avisé"
LABEL version="1.0.0"

WORKDIR /app

# Security: Create non-root user before copying files
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy only source code (exclude tests, migrations SQL, docs)
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs server.js setup.js ./

# Expose service port
EXPOSE 5000

# Health check (liveness + readiness probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Switch to non-root user before running app
USER nodejs

# Start application
CMD ["node", "server.js"]
