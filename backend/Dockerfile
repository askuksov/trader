FROM golang:1.25-alpine AS base

WORKDIR /app

# Install git, ca-certificates, and curl for health checks
RUN apk add --no-cache git ca-certificates curl

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Development stage with live reload
FROM base AS development

# Install Air for live reload
RUN go install github.com/air-verse/air@latest

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Use Air for live reload in development
CMD ["air", "-c", ".air.toml"]

# Production builder stage
FROM base AS builder

# Copy source code
COPY . .

# Build the applications
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/migrate ./cmd/migrate

# Final production stage
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates tzdata curl
WORKDIR /root/

# Copy the binaries from builder stage
COPY --from=builder /app/bin/api .
COPY --from=builder /app/bin/migrate .

# Expose port
EXPOSE 8080

# Command to run
CMD ["./api"]
