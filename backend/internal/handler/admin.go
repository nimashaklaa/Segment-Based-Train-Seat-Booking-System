package handler

import (
	"net/http"
)

// GET /admin/occupancy?journey_id=
func (h *Handler) GetOccupancy(w http.ResponseWriter, r *http.Request) {
	journeyID := r.URL.Query().Get("journey_id")
	if journeyID == "" {
		writeError(w, http.StatusBadRequest, "journey_id is required")
		return
	}
	result, err := h.svc.GetOccupancy(r.Context(), journeyID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// GET /admin/revenue?journey_id=
func (h *Handler) GetRevenue(w http.ResponseWriter, r *http.Request) {
	journeyID := r.URL.Query().Get("journey_id")
	if journeyID == "" {
		writeError(w, http.StatusBadRequest, "journey_id is required")
		return
	}
	result, err := h.svc.GetRevenue(r.Context(), journeyID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
