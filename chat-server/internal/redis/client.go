package redis

import (
	"context"
	"fmt"
	"log"
	"net/url"

	"github.com/redis/go-redis/v9"
)

const (
	OrderUpdatesStream = "order_updates_stream"
	ConsumerGroup      = "chat-server-group"
	ConsumerName       = "chat-server-1"
)

type Client struct {
	RDB *redis.Client
}

func NewClient(redisURL string) (*Client, error) {
	opts, err := parseRedisURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	rdb := redis.NewClient(opts)
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	log.Println("Connected to Redis")
	return &Client{RDB: rdb}, nil
}

// EnsureStreamGroup creates the consumer group if it doesn't exist.
func (c *Client) EnsureStreamGroup(ctx context.Context) error {
	err := c.RDB.XGroupCreateMkStream(ctx, OrderUpdatesStream, ConsumerGroup, "$").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		return fmt.Errorf("create consumer group: %w", err)
	}
	return nil
}

// ReadStream reads messages from a stream using consumer group.
func (c *Client) ReadStream(ctx context.Context, count int64, block int64) ([]redis.XStream, error) {
	return c.RDB.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    ConsumerGroup,
		Consumer: ConsumerName,
		Streams:  []string{OrderUpdatesStream, ">"},
		Count:    count,
		Block:    0, // block indefinitely; caller controls via ctx
	}).Result()
}

// AckStream acknowledges processed messages.
func (c *Client) AckStream(ctx context.Context, stream string, ids ...string) error {
	return c.RDB.XAck(ctx, stream, ConsumerGroup, ids...).Err()
}

func (c *Client) Close() error {
	return c.RDB.Close()
}

func parseRedisURL(rawURL string) (*redis.Options, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, err
	}

	addr := u.Host
	if u.Port() == "" {
		addr = addr + ":6379"
	}

	password, _ := u.User.Password()

	return &redis.Options{
		Addr:     addr,
		Password: password,
	}, nil
}
