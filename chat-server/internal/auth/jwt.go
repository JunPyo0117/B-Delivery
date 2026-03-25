package auth

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT payload from the chat token endpoint.
type Claims struct {
	Role     string `json:"role"`
	Nickname string `json:"nickname"`
	jwt.RegisteredClaims
}

// ParseToken validates an HS256-signed JWT and returns the claims.
func ParseToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}
