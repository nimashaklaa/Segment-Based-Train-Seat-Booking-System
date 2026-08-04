package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

// passengerJourneyRequest is the shared HTTP request body for booking and waitlist.
type passengerJourneyRequest struct {
	JourneyID      string `json:"journey_id"`
	SeatID         string `json:"seat_id"`
	FromStationID  string `json:"from_station_id"`
	ToStationID    string `json:"to_station_id"`
	PassengerName  string `json:"passenger_name"`
	PassengerEmail string `json:"passenger_email"`
}

// Handler holds the service layer and delegates all business logic to it.
type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

// decodePassengerJourneyRequest parses and validates the shared request body.
// Returns ok=false if an error response has already been written.
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
	atIdx := strings.Index(req.PassengerEmail, "@")
	if atIdx < 0 || !strings.Contains(req.PassengerEmail[atIdx:], ".") {
		writeError(w, http.StatusUnprocessableEntity, "invalid email address")
		return req, false
	}
	return req, true
}

// mapServiceError converts a service-layer error to the appropriate HTTP response.
func mapServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, err.Error())
	case errors.Is(err, service.ErrConflict):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, service.ErrInvalid):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
