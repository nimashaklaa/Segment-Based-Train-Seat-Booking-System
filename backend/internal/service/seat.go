package service

import (
	"context"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

func (s *Service) ListSeatsByCoach(ctx context.Context, coachID string) ([]db.Seat, error) {
	seats, err := s.queries.ListSeatsByCoach(ctx, coachID)
	if err != nil {
		return nil, err
	}
	if seats == nil {
		seats = []db.Seat{}
	}
	return seats, nil
}

// GetAvailableSeats returns seats not booked for any overlapping segment.
//
// Note: GetAvailableSeatsParams field names are swapped relative to their SQL
// position — AlightSequence=$3 checks b.alight_sequence > our_board, and
// BoardSequence=$4 checks b.board_sequence < our_alight. We pass accordingly.
func (s *Service) GetAvailableSeats(ctx context.Context, journeyID, fromID, toID, coachTypeID string) ([]db.Seat, error) {
	fromStation, toStation, err := s.resolveStations(ctx, fromID, toID)
	if err != nil {
		return nil, err
	}

	seats, err := s.queries.GetAvailableSeats(ctx, db.GetAvailableSeatsParams{
		CoachTypeID:    coachTypeID,
		JourneyID:      journeyID,
		AlightSequence: fromStation.SequenceOrder,
		BoardSequence:  toStation.SequenceOrder,
	})
	if err != nil {
		return nil, err
	}
	if seats == nil {
		seats = []db.Seat{}
	}
	return seats, nil
}
