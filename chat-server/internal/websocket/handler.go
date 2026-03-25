package websocket

import (
	"log"

	"github.com/bdelivery/chat-server/internal/auth"
	"github.com/gofiber/fiber/v2"
	ws "github.com/gofiber/websocket/v2"
)

// WSAuthMiddleware validates JWT before WebSocket upgrade.
func WSAuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Query("token")
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing token",
			})
		}

		claims, err := auth.ParseToken(token, jwtSecret)
		if err != nil {
			log.Printf("JWT validation failed: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token",
			})
		}

		c.Locals("userId", claims.Subject)
		c.Locals("role", claims.Role)
		c.Locals("nickname", claims.Nickname)
		return c.Next()
	}
}

// NewWSHandler returns a Fiber WebSocket handler.
func NewWSHandler(hub *Hub, onMsg MessageHandler) fiber.Handler {
	return ws.New(func(conn *ws.Conn) {
		userID, _ := conn.Locals("userId").(string)
		role, _ := conn.Locals("role").(string)
		nickname, _ := conn.Locals("nickname").(string)

		client := &Client{
			UserID:   userID,
			Nickname: nickname,
			Role:     role,
			Conn:     conn,
			Send:     make(chan []byte, sendBufSize),
			Hub:      hub,
			OnMsg:    onMsg,
		}

		hub.Register(client)

		go client.WritePump()
		client.ReadPump()
	})
}
