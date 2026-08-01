package handler

import (
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// GET /coaches?type_id=
func (h *Handler) ListCoaches(w http.ResponseWriter, r *http.Request) {
	typeID := r.URL.Query().Get("type_id")
	if typeID == "" {
		writeError(w, http.StatusBadRequest, "type_id is required")
		return
	}
	coaches, err := h.queries.ListCoachesByType(r.Context(), typeID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list coaches")
		return
	}
	if coaches == nil {
		coaches = []db.Coach{}
	}
	writeJSON(w, http.StatusOK, coaches)
}
