# Backend Dockerfile
FROM golang:1.25-alpine AS base

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata curl

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Development stage
FROM base AS development

# Install air for hot reload
RUN go install github.com/air-verse/air@latest

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Run with air for hot reload
CMD ["air", "-c", ".air.toml"]

# Production build stage
FROM base AS build

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Production stage
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Copy the binary
COPY --from=build /app/main .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Run the binary
CMD ["./main"]
