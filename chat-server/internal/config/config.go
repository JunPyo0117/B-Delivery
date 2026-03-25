package config

import "os"

type Config struct {
	Port        string
	RedisURL    string
	DatabaseURL string
	JWTSecret   string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/bdelivery"),
		JWTSecret:   mustGetEnv("JWT_SECRET"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required environment variable not set: " + key)
	}
	return v
}
