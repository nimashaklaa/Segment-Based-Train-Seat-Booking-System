package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// Service holds all dependencies shared across business logic methods.
type Service struct {
	queries       db.Querier
	fareRatePerKm float64
}

func New(q db.Querier, fareRatePerKm float64) *Service {
	return &Service{queries: q, fareRatePerKm: fareRatePerKm}
}

// resolveStations fetches both stations and verifies the from→to direction.
func (s *Service) resolveStations(ctx context.Context, fromID, toID string) (from db.Station, to db.Station, err error) {
	from, err = s.queries.GetStation(ctx, fromID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.Station{}, db.Station{}, fmt.Errorf("from station: %w", ErrNotFound)
		}
		return db.Station{}, db.Station{}, err
	}
	to, err = s.queries.GetStation(ctx, toID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.Station{}, db.Station{}, fmt.Errorf("to station: %w", ErrNotFound)
		}
		return db.Station{}, db.Station{}, err
	}
	if from.SequenceOrder >= to.SequenceOrder {
		return db.Station{}, db.Station{}, fmt.Errorf("from station must come before to station on the route: %w", ErrInvalid)
	}
	return from, to, nil
}

// verifyOwner fetches a booking and confirms the email belongs to the passenger.
func (s *Service) verifyOwner(ctx context.Context, id, email string) (db.GetBookingRow, error) {
	booking, err := s.queries.GetBooking(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.GetBookingRow{}, fmt.Errorf("booking: %w", ErrNotFound)
		}
		return db.GetBookingRow{}, err
	}
	if !strings.EqualFold(booking.PassengerEmail, email) {
		return db.GetBookingRow{}, fmt.Errorf("email does not match this booking: %w", ErrForbidden)
	}
	return booking, nil
}
