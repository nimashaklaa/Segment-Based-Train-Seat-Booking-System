package handler

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
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

	fromStation, err := h.queries.GetStation(r.Context(), fromID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "from station not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get from station")
		return
	}
	toStation, err := h.queries.GetStation(r.Context(), toID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "to station not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get to station")
		return
	}

	if fromStation.SequenceOrder >= toStation.SequenceOrder {
		writeError(w, http.StatusBadRequest, "from station must come before to station on the route")
		return
	}

	// Note: the GetAvailableSeatsParams field names are swapped relative to
	// their meaning in the WHERE clause:
	//   $3 (AlightSequence) -> used as: b.alight_sequence > $3  => our board sequence
	//   $4 (BoardSequence)  -> used as: b.board_sequence  < $4  => our alight sequence
	seats, err := h.queries.GetAvailableSeats(r.Context(), db.GetAvailableSeatsParams{
		CoachTypeID:    coachTypeID,
		JourneyID:      journeyID,
		AlightSequence: fromStation.SequenceOrder,
		BoardSequence:  toStation.SequenceOrder,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get available seats")
		return
	}
	if seats == nil {
		seats = []db.Seat{}
	}
	writeJSON(w, http.StatusOK, seats)
}
