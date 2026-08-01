package handler

import (
	"net/http"

	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

// POST /waitlist
func (h *Handler) CreateWaitlistEntry(w http.ResponseWriter, r *http.Request) {
	req, ok := decodePassengerJourneyRequest(w, r)
	if !ok {
		return
	}
	entry, err := h.svc.CreateWaitlistEntry(r.Context(), service.BookingInput{
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
	writeJSON(w, http.StatusCreated, entry)
}
