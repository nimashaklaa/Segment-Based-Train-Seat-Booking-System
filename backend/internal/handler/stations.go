package handler

import (
	"net/http"
)

// GET /stations?route_id=
func (h *Handler) ListStations(w http.ResponseWriter, r *http.Request) {
	routeID := r.URL.Query().Get("route_id")
	if routeID == "" {
		writeError(w, http.StatusBadRequest, "route_id is required")
		return
	}
	stations, err := h.svc.ListStations(r.Context(), routeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, stations)
}
