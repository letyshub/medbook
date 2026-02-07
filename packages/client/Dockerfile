# Development Dockerfile for MedBook Client
# React + Vite frontend with hot-reload

FROM node:20-slim

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (will be overridden by volume mount in dev)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Development command with hot-reload
# --host flag allows access from outside container
CMD ["npm", "run", "dev", "--", "--host"]
