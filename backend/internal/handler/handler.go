package handler

import (
	"encoding/json"
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// Handler holds shared dependencies for all route handlers.
type Handler struct {
	queries       db.Querier
	fareRatePerKm float64
}

func New(queries db.Querier, fareRatePerKm float64) *Handler {
	return &Handler{queries: queries, fareRatePerKm: fareRatePerKm}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
