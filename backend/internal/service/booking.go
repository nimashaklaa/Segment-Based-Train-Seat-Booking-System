package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/lib/pq"
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
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return db.CreateBookingRow{}, ErrConflict
		}
		return db.CreateBookingRow{}, fmt.Errorf("create booking: %w", err)
	}

	bookingID := booking.ID
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := m.SendBookingConfirmation(ctx, mailer.BookingConfirmationData{
			PassengerName:  booking.PassengerName,
			PassengerEmail: booking.PassengerEmail,
			BookingID:      booking.ID,
			JourneyID:      booking.JourneyID,
			SeatID:         booking.SeatID,
			BoardStation:   fromStation.Name,
			AlightStation:  toStation.Name,
			Fare:           booking.Fare,
		}); err != nil {
			log.Printf("failed to send confirmation email for booking %s: %v", bookingID, err)
		}
	}()

	return booking, nil
}

func (s *Service) GetBooking(ctx context.Context, id, email string) (db.GetBookingRow, error) {
	return s.verifyOwner(ctx, id, email)
}

func (s *Service) CancelBooking(ctx context.Context, m *mailer.Mailer, id, email string) (db.CancelBookingRow, error) {
	if _, err := s.verifyOwner(ctx, id, email); err != nil {
		return db.CancelBookingRow{}, err
	}
	cancelled, err := s.queries.CancelBooking(ctx, id)
	if err != nil {
		return db.CancelBookingRow{}, err
	}
	go s.notifyNextWaitlistEntry(context.Background(), m, cancelled)
	return cancelled, nil
}

// notifyNextWaitlistEntry finds the earliest PENDING waitlist entry whose requested
// segment overlaps the freed booking segment, marks it NOTIFIED, and emails the passenger.
func (s *Service) notifyNextWaitlistEntry(ctx context.Context, m *mailer.Mailer, b db.CancelBookingRow) {
	const q = `
		SELECT id, passenger_name, passenger_email, board_station_id, alight_station_id
		FROM waitlist
		WHERE journey_id     = $1
		  AND seat_id        = $2
		  AND status         = 'PENDING'
		  AND board_sequence  < $3
		  AND alight_sequence > $4
		ORDER BY created_at
		LIMIT 1
	`
	var entryID, name, email, boardID, alightID string
	err := s.rawDB.QueryRowContext(ctx, q,
		b.JourneyID, b.SeatID, b.AlightSequence, b.BoardSequence,
	).Scan(&entryID, &name, &email, &boardID, &alightID)
	if errors.Is(err, sql.ErrNoRows) {
		return // no one waiting
	}
	if err != nil {
		log.Printf("waitlist notify: query failed: %v", err)
		return
	}

	// Mark NOTIFIED before sending to prevent double-notification.
	if _, err := s.queries.UpdateWaitlistStatus(ctx, db.UpdateWaitlistStatusParams{
		ID: entryID, Status: "NOTIFIED",
	}); err != nil {
		log.Printf("waitlist notify: failed to mark entry %s as NOTIFIED: %v", entryID, err)
		return
	}

	boardStation, err := s.queries.GetStation(ctx, boardID)
	if err != nil {
		log.Printf("waitlist notify: get board station %s: %v", boardID, err)
		return
	}
	alightStation, err := s.queries.GetStation(ctx, alightID)
	if err != nil {
		log.Printf("waitlist notify: get alight station %s: %v", alightID, err)
		return
	}

	if err := m.SendWaitlistNotification(ctx, mailer.WaitlistNotificationData{
		PassengerName:  name,
		PassengerEmail: email,
		BoardStation:   boardStation.Name,
		AlightStation:  alightStation.Name,
		JourneyID:      b.JourneyID,
	}); err != nil {
		log.Printf("waitlist notify: failed to email %s for entry %s: %v", email, entryID, err)
	}
}
