package handler

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
	"github.com/nimashaklaa/train-seat-booking/internal/service"
)

type bookingResponse struct {
	ID              string    `json:"id"`
	JourneyID       string    `json:"journey_id"`
	SeatID          string    `json:"seat_id"`
	BoardStationID  string    `json:"board_station_id"`
	AlightStationID string    `json:"alight_station_id"`
	PassengerName   string    `json:"passenger_name"`
	PassengerEmail  string    `json:"passenger_email"`
	Fare            string    `json:"fare"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}

func bookingResp(id, journeyID, seatID, boardSt, alightSt, name, email, fare, status string, createdAt sql.NullTime) bookingResponse {
	t := createdAt.Time
	if !createdAt.Valid {
		t = time.Now()
	}
	return bookingResponse{
		ID:              id,
		JourneyID:       journeyID,
		SeatID:          seatID,
		BoardStationID:  boardSt,
		AlightStationID: alightSt,
		PassengerName:   name,
		PassengerEmail:  email,
		Fare:            fare,
		Status:          status,
		CreatedAt:       t,
	}
}

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
		writeJSON(w, http.StatusCreated, bookingResp(booking.ID, booking.JourneyID, booking.SeatID, booking.BoardStationID, booking.AlightStationID, booking.PassengerName, booking.PassengerEmail, booking.Fare, booking.Status, booking.CreatedAt))
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
	writeJSON(w, http.StatusOK, bookingResp(booking.ID, booking.JourneyID, booking.SeatID, booking.BoardStationID, booking.AlightStationID, booking.PassengerName, booking.PassengerEmail, booking.Fare, booking.Status, booking.CreatedAt))
}

// DELETE /bookings/{id}?email=
func (h *Handler) CancelBooking(m *mailer.Mailer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		email := strings.TrimSpace(r.URL.Query().Get("email"))
		if email == "" {
			writeError(w, http.StatusBadRequest, "email query parameter is required")
			return
		}
		booking, err := h.svc.CancelBooking(r.Context(), m, id, email)
		if err != nil {
			mapServiceError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, bookingResp(booking.ID, booking.JourneyID, booking.SeatID, booking.BoardStationID, booking.AlightStationID, booking.PassengerName, booking.PassengerEmail, booking.Fare, booking.Status, booking.CreatedAt))
	}
}
