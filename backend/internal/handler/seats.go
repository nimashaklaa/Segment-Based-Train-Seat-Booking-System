package handler

import (
	"net/http"
)

// GET /seats/available?journey_id=&from_id=&to_id=&coach_type_id=
func (h *Handler) GetAvailableSeats(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	journeyID := q.Get("journey_id")
	fromID := q.Get("from_id")
	toID := q.Get("to_id")
	coachTypeID := q.Get("coach_type_id")

	if journeyID == "" || fromID == "" || toID == "" || coachTypeID == "" {
		writeError(w, http.StatusBadRequest, "journey_id, from_id, to_id and coach_type_id are required")
		return
	}

	seats, err := h.svc.GetAvailableSeats(r.Context(), journeyID, fromID, toID, coachTypeID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, seats)
}
