package chat

import (
	"context"
	"encoding/json"
	"log"

	"github.com/bdelivery/chat-server/internal/database"
	"github.com/bdelivery/chat-server/internal/models"
	"github.com/bdelivery/chat-server/internal/websocket"
	"github.com/google/uuid"
)

type Service struct {
	DB  *database.DB
	Hub *websocket.Hub
}

func NewService(db *database.DB, hub *websocket.Hub) *Service {
	return &Service{DB: db, Hub: hub}
}

// HandleMessage is the central router for all incoming WebSocket messages.
func (s *Service) HandleMessage(client *websocket.Client, msg models.WSMessage) {
	switch msg.Type {
	case "chat_message":
		s.handleChatMessage(client, msg.Payload)
	case "typing":
		s.handleTyping(client, msg.Payload)
	case "read":
		s.handleRead(client, msg.Payload)
	default:
		log.Printf("Unknown message type: %s (userId=%s)", msg.Type, client.UserID)
	}
}

func (s *Service) handleChatMessage(client *websocket.Client, payload json.RawMessage) {
	var p models.ChatMessagePayload
	if err := json.Unmarshal(payload, &p); err != nil {
		log.Printf("Invalid chat_message payload: %v", err)
		return
	}

	if p.ChatID == "" || p.Content == "" {
		log.Printf("Empty chatId or content from userId=%s", client.UserID)
		return
	}

	if p.Type == "" {
		p.Type = "TEXT"
	}

	ctx := context.Background()

	// Verify sender is a participant of the chat
	participants, err := s.DB.GetChatParticipants(ctx, p.ChatID)
	if err != nil {
		log.Printf("Failed to get chat participants (chatId=%s): %v", p.ChatID, err)
		return
	}

	if client.UserID != participants.CustomerID && client.UserID != participants.OwnerID {
		log.Printf("User %s is not a participant of chat %s", client.UserID, p.ChatID)
		return
	}

	// Save message to DB
	msgID := uuid.New().String()
	createdAt, err := s.DB.SaveMessage(ctx, msgID, p.ChatID, client.UserID, p.Type, p.Content)
	if err != nil {
		log.Printf("Failed to save message: %v", err)
		return
	}

	// Update chat timestamp
	_ = s.DB.UpdateChatTimestamp(ctx, p.ChatID)

	// Build response
	resp := models.ChatMessageResponse{
		ID:        msgID,
		ChatID:    p.ChatID,
		SenderID:  client.UserID,
		Nickname:  client.Nickname,
		Type:      p.Type,
		Content:   p.Content,
		IsRead:    false,
		CreatedAt: createdAt,
	}

	respPayload, _ := json.Marshal(resp)
	wsMsg := models.WSMessage{
		Type:    "chat_message",
		Payload: respPayload,
	}

	// Determine the other party
	recipientID := participants.OwnerID
	if client.UserID == participants.OwnerID {
		recipientID = participants.CustomerID
	}

	// Send to recipient
	s.Hub.SendToUser(recipientID, wsMsg)

	// Send ack to sender
	ack := models.MessageAck{ID: msgID, CreatedAt: createdAt}
	ackPayload, _ := json.Marshal(ack)
	s.Hub.SendToUser(client.UserID, models.WSMessage{
		Type:    "message_ack",
		Payload: ackPayload,
	})
}

func (s *Service) handleTyping(client *websocket.Client, payload json.RawMessage) {
	var p models.TypingPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return
	}

	ctx := context.Background()
	participants, err := s.DB.GetChatParticipants(ctx, p.ChatID)
	if err != nil {
		return
	}

	recipientID := participants.OwnerID
	if client.UserID == participants.OwnerID {
		recipientID = participants.CustomerID
	}

	typingEvent := struct {
		ChatID   string `json:"chatId"`
		UserID   string `json:"userId"`
		IsTyping bool   `json:"isTyping"`
	}{
		ChatID:   p.ChatID,
		UserID:   client.UserID,
		IsTyping: p.IsTyping,
	}

	eventPayload, _ := json.Marshal(typingEvent)
	s.Hub.SendToUser(recipientID, models.WSMessage{
		Type:    "typing",
		Payload: eventPayload,
	})
}

func (s *Service) handleRead(client *websocket.Client, payload json.RawMessage) {
	var p models.ReadPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return
	}

	ctx := context.Background()

	count, err := s.DB.MarkMessagesAsRead(ctx, p.ChatID, client.UserID)
	if err != nil {
		log.Printf("Failed to mark messages as read: %v", err)
		return
	}

	if count == 0 {
		return
	}

	// Notify the sender that their messages were read
	participants, err := s.DB.GetChatParticipants(ctx, p.ChatID)
	if err != nil {
		return
	}

	recipientID := participants.OwnerID
	if client.UserID == participants.OwnerID {
		recipientID = participants.CustomerID
	}

	receipt := models.ReadReceiptEvent{
		ChatID: p.ChatID,
		UserID: client.UserID,
	}
	receiptPayload, _ := json.Marshal(receipt)
	s.Hub.SendToUser(recipientID, models.WSMessage{
		Type:    "read_receipt",
		Payload: receiptPayload,
	})
}
