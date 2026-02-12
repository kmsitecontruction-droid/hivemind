FROM node:20-alpine

WORKDIR /app

# Install dependencies for system monitoring
RUN apk add --no-cache linux-headers libusb

# Copy server
COPY dist/server/ ./server/
COPY dist/web/ ./web/
COPY dist/admin/ ./admin/
COPY dist/client/ ./client/
COPY package*.json ./

# Install production dependencies
WORKDIR /app/server
RUN npm install --production 2>/dev/null || echo "No deps"

# Create environment file
ENV SERVER_PORT=8080
ENV NODE_ENV=production

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start server
WORKDIR /app/server
CMD ["sh", "-c", "node index.js"]
