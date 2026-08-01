package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
)

// passengerJourneyRequest is the shared request body for booking and waitlist endpoints.
type passengerJourneyRequest struct {
	JourneyID      string `json:"journey_id"`
	SeatID         string `json:"seat_id"`
	FromStationID  string `json:"from_station_id"`
	ToStationID    string `json:"to_station_id"`
	PassengerName  string `json:"passenger_name"`
	PassengerEmail string `json:"passenger_email"`
}

// Handler holds shared dependencies for all route handlers.
type Handler struct {
	queries       db.Querier
	mailer        *mailer.Mailer
	fareRatePerKm float64
}

func New(queries db.Querier, m *mailer.Mailer, fareRatePerKm float64) *Handler {
	return &Handler{queries: queries, mailer: m, fareRatePerKm: fareRatePerKm}
}

// decodePassengerJourneyRequest decodes and validates the shared booking/waitlist request body.
// Returns ok=false if an error response has already been written to w.
func decodePassengerJourneyRequest(w http.ResponseWriter, r *http.Request) (passengerJourneyRequest, bool) {
	var req passengerJourneyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return req, false
	}
	if req.JourneyID == "" || req.SeatID == "" || req.FromStationID == "" ||
		req.ToStationID == "" || req.PassengerName == "" || req.PassengerEmail == "" {
		writeError(w, http.StatusBadRequest, "journey_id, seat_id, from_station_id, to_station_id, passenger_name and passenger_email are required")
		return req, false
	}
	return req, true
}

// resolveStations fetches from/to stations and validates their sequence order.
// Returns ok=false if an error response has already been written to w.
func (h *Handler) resolveStations(w http.ResponseWriter, r *http.Request, fromID, toID string) (from db.Station, to db.Station, ok bool) {
	var err error
	from, err = h.queries.GetStation(r.Context(), fromID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "from station not found")
		} else {
			writeError(w, http.StatusInternalServerError, "failed to get from station")
		}
		return
	}
	to, err = h.queries.GetStation(r.Context(), toID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "to station not found")
		} else {
			writeError(w, http.StatusInternalServerError, "failed to get to station")
		}
		return
	}
	if from.SequenceOrder >= to.SequenceOrder {
		writeError(w, http.StatusBadRequest, "from station must come before to station on the route")
		return
	}
	ok = true
	return
}

// verifyBookingOwner fetches a booking and checks that email matches the passenger.
// Returns ok=false if an error response has already been written to w.
func (h *Handler) verifyBookingOwner(w http.ResponseWriter, r *http.Request, id, email string) (booking db.GetBookingRow, ok bool) {
	var err error
	booking, err = h.queries.GetBooking(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "booking not found")
		} else {
			writeError(w, http.StatusInternalServerError, "failed to get booking")
		}
		return
	}
	if !strings.EqualFold(booking.PassengerEmail, email) {
		writeError(w, http.StatusForbidden, "email does not match this booking")
		return
	}
	ok = true
	return
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
