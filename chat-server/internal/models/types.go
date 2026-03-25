package models

import (
	"encoding/json"
	"time"
)

// WSMessage is the envelope for all WebSocket communication.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// ChatMessagePayload is sent by client to create a new message.
type ChatMessagePayload struct {
	ChatID  string `json:"chatId"`
	Type    string `json:"type"`    // TEXT, IMAGE
	Content string `json:"content"`
}

// ChatMessageResponse is sent back to both sender and receiver.
type ChatMessageResponse struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chatId"`
	SenderID  string    `json:"senderId"`
	Nickname  string    `json:"nickname"`
	Type      string    `json:"type"`
	Content   string    `json:"content"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

// JoinChatPayload is sent by client to join a specific chat room.
type JoinChatPayload struct {
	ChatID string `json:"chatId"`
}

// TypingPayload is sent when a user starts/stops typing.
type TypingPayload struct {
	ChatID   string `json:"chatId"`
	IsTyping bool   `json:"isTyping"`
}

// ReadPayload is sent when a user reads messages in a chat.
type ReadPayload struct {
	ChatID string `json:"chatId"`
}

// ReadReceiptEvent is broadcast to notify the sender their messages were read.
type ReadReceiptEvent struct {
	ChatID string `json:"chatId"`
	UserID string `json:"userId"`
}

// OrderUpdateEvent is consumed from Redis Stream.
type OrderUpdateEvent struct {
	OrderID   string `json:"orderId"`
	NewStatus string `json:"newStatus"`
	UserID    string `json:"userId"`
	Timestamp string `json:"timestamp"`
}

// MessageAck is sent back to the sender after a message is saved.
type MessageAck struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}
