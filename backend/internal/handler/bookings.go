package handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/nimashaklaa/train-seat-booking/internal/db"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
)

// POST /bookings
func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	req, ok := decodePassengerJourneyRequest(w, r)
	if !ok {
		return
	}

	fromStation, toStation, ok := h.resolveStations(w, r, req.FromStationID, req.ToStationID)
	if !ok {
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

	go func() {
		if err := h.mailer.SendBookingConfirmation(mailer.BookingConfirmationData{
			PassengerName:  booking.PassengerName,
			PassengerEmail: booking.PassengerEmail,
			BookingID:      booking.ID,
			JourneyID:      booking.JourneyID,
			SeatID:         booking.SeatID,
			BoardStation:   fromStation.Name,
			AlightStation:  toStation.Name,
			Fare:           booking.Fare,
		}); err != nil {
			log.Printf("failed to send booking confirmation email for booking %s: %v", booking.ID, err)
		}
	}()

	writeJSON(w, http.StatusCreated, booking)
}

// GET /bookings/{id}?email=
// Passengers must supply their email to retrieve the booking.
func (h *Handler) GetBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	email := strings.TrimSpace(r.URL.Query().Get("email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "email query parameter is required")
		return
	}
	booking, ok := h.verifyBookingOwner(w, r, id, email)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, booking)
}

// DELETE /bookings/{id}?email=
// Passengers must supply their email to cancel the booking.
func (h *Handler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	email := strings.TrimSpace(r.URL.Query().Get("email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "email query parameter is required")
		return
	}
	if _, ok := h.verifyBookingOwner(w, r, id, email); !ok {
		return
	}
	booking, err := h.queries.CancelBooking(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to cancel booking")
		return
	}
	writeJSON(w, http.StatusOK, booking)
}
