package stream

import (
	"context"
	"encoding/json"
	"log"

	"github.com/bdelivery/chat-server/internal/models"
	redisclient "github.com/bdelivery/chat-server/internal/redis"
	"github.com/bdelivery/chat-server/internal/websocket"
)

type Consumer struct {
	Redis *redisclient.Client
	Hub   *websocket.Hub
}

func NewConsumer(r *redisclient.Client, hub *websocket.Hub) *Consumer {
	return &Consumer{Redis: r, Hub: hub}
}

// Run starts consuming order update events from Redis Stream.
// It blocks until the context is cancelled.
func (c *Consumer) Run(ctx context.Context) {
	log.Println("Stream consumer started for:", redisclient.OrderUpdatesStream)

	for {
		select {
		case <-ctx.Done():
			log.Println("Stream consumer stopped")
			return
		default:
		}

		streams, err := c.Redis.ReadStream(ctx, 10, 5000)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("Stream read error: %v", err)
			continue
		}

		for _, stream := range streams {
			for _, msg := range stream.Messages {
				c.processOrderUpdate(ctx, msg.ID, msg.Values)
			}
		}
	}
}

func (c *Consumer) processOrderUpdate(ctx context.Context, msgID string, values map[string]interface{}) {
	event := models.OrderUpdateEvent{
		OrderID:   getString(values, "orderId"),
		NewStatus: getString(values, "newStatus"),
		UserID:    getString(values, "userId"),
		Timestamp: getString(values, "timestamp"),
	}

	if event.UserID == "" || event.OrderID == "" {
		log.Printf("Invalid order update event: %+v", values)
		_ = c.Redis.AckStream(ctx, redisclient.OrderUpdatesStream, msgID)
		return
	}

	payload, _ := json.Marshal(event)
	c.Hub.SendToUser(event.UserID, models.WSMessage{
		Type:    "order_update",
		Payload: payload,
	})

	if err := c.Redis.AckStream(ctx, redisclient.OrderUpdatesStream, msgID); err != nil {
		log.Printf("Failed to ack stream message %s: %v", msgID, err)
	}

	log.Printf("Order update pushed: orderId=%s status=%s userId=%s", event.OrderID, event.NewStatus, event.UserID)
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
