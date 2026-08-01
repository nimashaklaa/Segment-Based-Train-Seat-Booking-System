package service

import (
	"context"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

func (s *Service) CreateWaitlistEntry(ctx context.Context, input BookingInput) (db.Waitlist, error) {
	fromStation, toStation, err := s.resolveStations(ctx, input.FromStationID, input.ToStationID)
	if err != nil {
		return db.Waitlist{}, err
	}

	return s.queries.CreateWaitlistEntry(ctx, db.CreateWaitlistEntryParams{
		JourneyID:       input.JourneyID,
		SeatID:          input.SeatID,
		BoardStationID:  input.FromStationID,
		AlightStationID: input.ToStationID,
		BoardSequence:   fromStation.SequenceOrder,
		AlightSequence:  toStation.SequenceOrder,
		PassengerName:   input.PassengerName,
		PassengerEmail:  input.PassengerEmail,
	})
}
