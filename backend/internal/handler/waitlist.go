package handler

import (
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// POST /waitlist
func (h *Handler) CreateWaitlistEntry(w http.ResponseWriter, r *http.Request) {
	req, ok := decodePassengerJourneyRequest(w, r)
	if !ok {
		return
	}

	fromStation, toStation, ok := h.resolveStations(w, r, req.FromStationID, req.ToStationID)
	if !ok {
		return
	}

	entry, err := h.queries.CreateWaitlistEntry(r.Context(), db.CreateWaitlistEntryParams{
		JourneyID:       req.JourneyID,
		SeatID:          req.SeatID,
		BoardStationID:  req.FromStationID,
		AlightStationID: req.ToStationID,
		BoardSequence:   fromStation.SequenceOrder,
		AlightSequence:  toStation.SequenceOrder,
		PassengerName:   req.PassengerName,
		PassengerEmail:  req.PassengerEmail,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create waitlist entry")
		return
	}

	writeJSON(w, http.StatusCreated, entry)
}
