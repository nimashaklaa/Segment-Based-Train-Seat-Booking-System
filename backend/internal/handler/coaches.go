package handler

import (
	"net/http"
)

// GET /coaches?type_id=
func (h *Handler) ListCoaches(w http.ResponseWriter, r *http.Request) {
	typeID := r.URL.Query().Get("type_id")
	if typeID == "" {
		writeError(w, http.StatusBadRequest, "type_id is required")
		return
	}
	coaches, err := h.svc.ListCoaches(r.Context(), typeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, coaches)
}
