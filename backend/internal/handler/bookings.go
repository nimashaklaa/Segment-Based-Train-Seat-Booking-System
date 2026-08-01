package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

// POST /bookings
func (h *Handler) CreateBooking(m *mailer.Mailer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req, ok := decodePassengerJourneyRequest(w, r)
		if !ok {
			return
		}
		booking, err := h.svc.CreateBooking(r.Context(), m, service.BookingInput{
			JourneyID:      req.JourneyID,
			SeatID:         req.SeatID,
			FromStationID:  req.FromStationID,
			ToStationID:    req.ToStationID,
			PassengerName:  req.PassengerName,
			PassengerEmail: req.PassengerEmail,
		})
		if err != nil {
			mapServiceError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, booking)
	}
}

// GET /bookings/{id}?email=
func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	email := strings.TrimSpace(r.URL.Query().Get("email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "email query parameter is required")
		return
	}
	booking, err := h.svc.GetBooking(r.Context(), id, email)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, booking)
}

// DELETE /bookings/{id}?email=
func (h *Handler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	email := strings.TrimSpace(r.URL.Query().Get("email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "email query parameter is required")
		return
	}
	booking, err := h.svc.CancelBooking(r.Context(), id, email)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, booking)
}
