package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/bdelivery/chat-server/internal/chat"
	"github.com/bdelivery/chat-server/internal/config"
	"github.com/bdelivery/chat-server/internal/database"
	redisclient "github.com/bdelivery/chat-server/internal/redis"
	"github.com/bdelivery/chat-server/internal/stream"
	ws "github.com/bdelivery/chat-server/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg := config.Load()

	// Initialize database
	db, err := database.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	rdb, err := redisclient.NewClient(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer rdb.Close()

	// Ensure Redis Stream consumer group exists
	if err := rdb.EnsureStreamGroup(context.Background()); err != nil {
		log.Fatalf("Failed to create stream group: %v", err)
	}

	// Initialize WebSocket Hub
	hub := ws.NewHub()

	// Initialize Chat Service
	chatService := chat.NewService(db, hub)

	// Initialize Stream Consumer
	streamConsumer := stream.NewConsumer(rdb, hub)

	// Start stream consumer in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go streamConsumer.Run(ctx)

	// Setup Fiber
	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// WebSocket endpoint with JWT auth
	app.Use("/ws", ws.WSAuthMiddleware(cfg.JWTSecret))
	app.Get("/ws", ws.NewWSHandler(hub, chatService.HandleMessage))

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		log.Println("Shutting down...")
		cancel()
		_ = app.Shutdown()
	}()

	log.Printf("Chat server starting on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
