package handler

import (
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// GET /stations?route_id=
func (h *Handler) ListStations(w http.ResponseWriter, r *http.Request) {
	routeID := r.URL.Query().Get("route_id")
	if routeID == "" {
		writeError(w, http.StatusBadRequest, "route_id is required")
		return
	}
	stations, err := h.queries.ListStationsByRoute(r.Context(), routeID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list stations")
		return
	}
	if stations == nil {
		stations = []db.Station{}
	}
	writeJSON(w, http.StatusOK, stations)
}
