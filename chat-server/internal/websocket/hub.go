package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/bdelivery/chat-server/internal/models"
)

// Hub manages all active WebSocket clients.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool // userId -> set of clients
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[c.UserID] == nil {
		h.clients[c.UserID] = make(map[*Client]bool)
	}
	h.clients[c.UserID][c] = true
	log.Printf("Client registered: userId=%s (total connections: %d)", c.UserID, len(h.clients[c.UserID]))
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.clients[c.UserID]; ok {
		delete(conns, c)
		if len(conns) == 0 {
			delete(h.clients, c.UserID)
		}
	}
	log.Printf("Client unregistered: userId=%s", c.UserID)
}

// SendToUser sends a WSMessage to all connections of a user.
func (h *Hub) SendToUser(userID string, msg models.WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message for user %s: %v", userID, err)
		return
	}

	h.mu.RLock()
	conns := h.clients[userID]
	h.mu.RUnlock()

	for c := range conns {
		select {
		case c.Send <- data:
		default:
			log.Printf("Send buffer full for user %s, dropping message", userID)
		}
	}
}

// IsOnline checks if a user has at least one active connection.
func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[userID]) > 0
}
