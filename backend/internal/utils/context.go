package utils

import (
	"context"
	"time"
)

// ContextWithTimeout creates context with timeout
func ContextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}

// ContextWithDeadline creates context with deadline
func ContextWithDeadline(deadline time.Time) (context.Context, context.CancelFunc) {
	return context.WithDeadline(context.Background(), deadline)
}
