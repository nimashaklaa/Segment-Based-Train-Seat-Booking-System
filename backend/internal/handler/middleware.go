package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type adminClaims struct {
	jwt.RegisteredClaims
}

// AdminLogin handles POST /admin/login.
// Verifies username + password from env vars, returns a signed JWT valid for 8 hours.
func (h *Handler) AdminLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}
	if h.adminUser == "" || h.adminPass == "" {
		writeError(w, http.StatusUnauthorized, "admin access is not configured on this server")
		return
	}
	if req.Username != h.adminUser || req.Password != h.adminPass {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	claims := adminClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "admin",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(8 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(h.jwtSecret)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": signed})
}

// AdminAuth is middleware that validates a JWT Bearer token on all admin routes.
func (h *Handler) AdminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		if tokenStr == "" || tokenStr == auth {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		claims := &adminClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return h.jwtSecret, nil
		})
		if err != nil || !token.Valid || claims.Subject != "admin" {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		next.ServeHTTP(w, r)
	})
}
