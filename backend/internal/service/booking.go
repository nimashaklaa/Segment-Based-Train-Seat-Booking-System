package service

import (
	"context"
	"fmt"
	"log"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
	"github.com/nimashaklaa/train-seat-booking/internal/mailer"
)

type BookingInput struct {
	JourneyID      string
	SeatID         string
	FromStationID  string
	ToStationID    string
	PassengerName  string
	PassengerEmail string
}

func (s *Service) CreateBooking(ctx context.Context, m *mailer.Mailer, input BookingInput) (db.CreateBookingRow, error) {
	fromStation, toStation, err := s.resolveStations(ctx, input.FromStationID, input.ToStationID)
	if err != nil {
		return db.CreateBookingRow{}, err
	}

	var fromKm, toKm float64
	if _, err := fmt.Sscanf(fromStation.DistanceFromOriginKm, "%f", &fromKm); err != nil {
		return db.CreateBookingRow{}, fmt.Errorf("invalid distance for from station: %w", ErrInvalid)
	}
	if _, err := fmt.Sscanf(toStation.DistanceFromOriginKm, "%f", &toKm); err != nil {
		return db.CreateBookingRow{}, fmt.Errorf("invalid distance for to station: %w", ErrInvalid)
	}
	fare := fmt.Sprintf("%.2f", (toKm-fromKm)*s.fareRatePerKm)

	booking, err := s.queries.CreateBooking(ctx, db.CreateBookingParams{
		JourneyID:       input.JourneyID,
		SeatID:          input.SeatID,
		BoardStationID:  input.FromStationID,
		AlightStationID: input.ToStationID,
		BoardSequence:   fromStation.SequenceOrder,
		AlightSequence:  toStation.SequenceOrder,
		PassengerName:   input.PassengerName,
		PassengerEmail:  input.PassengerEmail,
		Fare:            fare,
	})
	if err != nil {
		return db.CreateBookingRow{}, fmt.Errorf("seat is not available for this segment: %w", ErrConflict)
	}

	go func() {
		if err := m.SendBookingConfirmation(mailer.BookingConfirmationData{
			PassengerName:  booking.PassengerName,
			PassengerEmail: booking.PassengerEmail,
			BookingID:      booking.ID,
			JourneyID:      booking.JourneyID,
			SeatID:         booking.SeatID,
			BoardStation:   fromStation.Name,
			AlightStation:  toStation.Name,
			Fare:           booking.Fare,
		}); err != nil {
			log.Printf("failed to send confirmation email for booking %s: %v", booking.ID, err)
		}
	}()

	return booking, nil
}

func (s *Service) GetBooking(ctx context.Context, id, email string) (db.GetBookingRow, error) {
	return s.verifyOwner(ctx, id, email)
}

func (s *Service) CancelBooking(ctx context.Context, id, email string) (db.CancelBookingRow, error) {
	if _, err := s.verifyOwner(ctx, id, email); err != nil {
		return db.CancelBookingRow{}, err
	}
	return s.queries.CancelBooking(ctx, id)
}
