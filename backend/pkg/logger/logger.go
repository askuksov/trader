package logger

import (
	"os"
	"strings"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func Init(level, format string) {
	// Set log level
	switch strings.ToLower(level) {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "info":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "warn":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	// Set time format
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Configure output format
	if strings.ToLower(format) == "console" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	} else {
		// JSON format (default)
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}

	log.Info().
		Str("level", level).
		Str("format", format).
		Msg("Logger initialized")
}
