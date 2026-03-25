package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func NewDB(databaseURL string) (*DB, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	cfg.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}

// SaveMessage inserts a new message and returns its id and createdAt.
func (db *DB) SaveMessage(ctx context.Context, id, chatID, senderID, msgType, content string) (time.Time, error) {
	var createdAt time.Time
	err := db.Pool.QueryRow(ctx,
		`INSERT INTO "Message" (id, "chatId", "senderId", type, content, "isRead", "createdAt")
		 VALUES ($1, $2, $3, $4, $5, false, NOW())
		 RETURNING "createdAt"`,
		id, chatID, senderID, msgType, content,
	).Scan(&createdAt)
	if err != nil {
		return time.Time{}, fmt.Errorf("save message: %w", err)
	}
	return createdAt, nil
}

// UpdateChatTimestamp updates the chat's updatedAt field.
func (db *DB) UpdateChatTimestamp(ctx context.Context, chatID string) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE "Chat" SET "updatedAt" = NOW() WHERE id = $1`, chatID)
	return err
}

// MarkMessagesAsRead marks all unread messages from the other user as read.
func (db *DB) MarkMessagesAsRead(ctx context.Context, chatID, readerID string) (int64, error) {
	tag, err := db.Pool.Exec(ctx,
		`UPDATE "Message" SET "isRead" = true
		 WHERE "chatId" = $1 AND "senderId" != $2 AND "isRead" = false`,
		chatID, readerID,
	)
	if err != nil {
		return 0, fmt.Errorf("mark messages read: %w", err)
	}
	return tag.RowsAffected(), nil
}

// ChatParticipant holds the two participants of a chat.
type ChatParticipant struct {
	CustomerID string
	OwnerID    string
}

// GetChatParticipants returns the customer and restaurant owner for a chat.
func (db *DB) GetChatParticipants(ctx context.Context, chatID string) (*ChatParticipant, error) {
	var p ChatParticipant
	err := db.Pool.QueryRow(ctx,
		`SELECT c."userId", r."ownerId"
		 FROM "Chat" c
		 JOIN "Order" o ON o.id = c."orderId"
		 JOIN "Restaurant" r ON r.id = o."restaurantId"
		 WHERE c.id = $1`,
		chatID,
	).Scan(&p.CustomerID, &p.OwnerID)
	if err != nil {
		return nil, fmt.Errorf("get chat participants: %w", err)
	}
	return &p, nil
}

// GetSenderNickname returns the nickname of a user.
func (db *DB) GetSenderNickname(ctx context.Context, userID string) (string, error) {
	var nickname string
	err := db.Pool.QueryRow(ctx,
		`SELECT nickname FROM "User" WHERE id = $1`, userID,
	).Scan(&nickname)
	if err != nil {
		return "", fmt.Errorf("get sender nickname: %w", err)
	}
	return nickname, nil
}
