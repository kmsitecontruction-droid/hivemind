# HIVEMIND Runtime Docker Image
# Full container for executing AI tasks with PyTorch + Transformers

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (needed for task runner)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Python ML libraries
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    transformers==4.36.0 \
    accelerate \
    sentence-transformers \
    huggingface-hub \
    psutil

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r hive && useradd -r -g hive -s /bin/sh hive

# Copy task execution script
COPY task-runner.js .

# Set permissions
RUN chown -R hive:hive /app

# Switch to non-root user
USER hive

# Default command
CMD ["node", "task-runner.js"]
