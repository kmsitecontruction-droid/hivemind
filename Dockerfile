FROM node:20-alpine

WORKDIR /app

# Install dependencies for system monitoring
RUN apk add --no-cache linux-headers libusb

# Copy package files FIRST (for caching)
COPY dist/server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy the rest of the app
COPY dist/server/ ./
COPY dist/web/ ./web/
COPY dist/admin/ ./admin/
COPY dist/client/ ./client/

# Environment
ENV PORT=3001
ENV NODE_ENV=production

# Expose ports
EXPOSE 3001

# Start server
CMD ["node", "index.js"]
