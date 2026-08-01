package handler

import (
	"net/http"
)

// GET /seats?coach_id=
func (h *Handler) ListSeatsByCoach(w http.ResponseWriter, r *http.Request) {
	coachID := r.URL.Query().Get("coach_id")
	if coachID == "" {
		writeError(w, http.StatusBadRequest, "coach_id is required")
		return
	}
	seats, err := h.svc.ListSeatsByCoach(r.Context(), coachID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, seats)
}

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
