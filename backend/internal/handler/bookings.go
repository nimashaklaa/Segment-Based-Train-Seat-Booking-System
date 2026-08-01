package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

type createBookingRequest struct {
	JourneyID      string `json:"journey_id"`
	SeatID         string `json:"seat_id"`
	FromStationID  string `json:"from_station_id"`
	ToStationID    string `json:"to_station_id"`
	PassengerName  string `json:"passenger_name"`
	PassengerEmail string `json:"passenger_email"`
}

// POST /bookings
func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	var req createBookingRequest
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

	var fromKm, toKm float64
	if _, err := fmt.Sscanf(fromStation.DistanceFromOriginKm, "%f", &fromKm); err != nil {
		writeError(w, http.StatusInternalServerError, "invalid distance for from station")
		return
	}
	if _, err := fmt.Sscanf(toStation.DistanceFromOriginKm, "%f", &toKm); err != nil {
		writeError(w, http.StatusInternalServerError, "invalid distance for to station")
		return
	}
	fare := fmt.Sprintf("%.2f", (toKm-fromKm)*h.fareRatePerKm)

	booking, err := h.queries.CreateBooking(r.Context(), db.CreateBookingParams{
		JourneyID:       req.JourneyID,
		SeatID:          req.SeatID,
		BoardStationID:  req.FromStationID,
		AlightStationID: req.ToStationID,
		BoardSequence:   fromStation.SequenceOrder,
		AlightSequence:  toStation.SequenceOrder,
		PassengerName:   req.PassengerName,
		PassengerEmail:  req.PassengerEmail,
		Fare:            fare,
	})
	if err != nil {
		writeError(w, http.StatusConflict, "seat is not available for this segment")
		return
	}

	writeJSON(w, http.StatusCreated, booking)
}

// GET /bookings/:id
func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	booking, err := h.queries.GetBooking(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "booking not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get booking")
		return
	}
	writeJSON(w, http.StatusOK, booking)
}

// DELETE /bookings/:id
func (h *Handler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	booking, err := h.queries.CancelBooking(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "booking not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to cancel booking")
		return
	}
	writeJSON(w, http.StatusOK, booking)
}
