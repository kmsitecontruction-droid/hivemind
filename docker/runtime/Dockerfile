# HIVEMIND Runtime Docker Image
# Lightweight container for executing AI tasks with resource limits

FROM node:20-alpine

# Install Python and PyTorch for model inference
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir torch transformers accelerate

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1000 hive && \
    adduser -u 1000 -G hive -s /bin/sh -D hive

# Copy task execution script
COPY task-runner.js .

# Set permissions
RUN chown -R hive:hive /app

# Switch to non-root user
USER hive

# Run task when container starts
CMD ["node", "task-runner.js"]
