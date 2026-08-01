package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

type createWaitlistRequest struct {
	JourneyID      string `json:"journey_id"`
	SeatID         string `json:"seat_id"`
	FromStationID  string `json:"from_station_id"`
	ToStationID    string `json:"to_station_id"`
	PassengerName  string `json:"passenger_name"`
	PassengerEmail string `json:"passenger_email"`
}

// POST /waitlist
func (h *Handler) CreateWaitlistEntry(w http.ResponseWriter, r *http.Request) {
	var req createWaitlistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.JourneyID == "" || req.SeatID == "" || req.FromStationID == "" ||
		req.ToStationID == "" || req.PassengerName == "" || req.PassengerEmail == "" {
		writeError(w, http.StatusBadRequest, "journey_id, seat_id, from_station_id, to_station_id, passenger_name and passenger_email are required")
		return
	}

	fromStation, err := h.queries.GetStation(r.Context(), req.FromStationID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "from station not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get from station")
		return
	}
	toStation, err := h.queries.GetStation(r.Context(), req.ToStationID)
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
