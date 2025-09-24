# Frontend Dockerfile
FROM node:24-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Development stage
FROM base AS development

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Production build stage
FROM base AS build

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
