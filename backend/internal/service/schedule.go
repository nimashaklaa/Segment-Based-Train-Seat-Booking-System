package service

import (
	"context"
	"time"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

func (s *Service) ListSchedulesByRoute(ctx context.Context, routeID string) ([]db.TrainSchedule, error) {
	schedules, err := s.queries.ListSchedulesByRoute(ctx, routeID)
	if err != nil {
		return nil, err
	}
	if schedules == nil {
		schedules = []db.TrainSchedule{}
	}
	return schedules, nil
}

func (s *Service) ListJourneysByDate(ctx context.Context, date time.Time) ([]db.TrainJourney, error) {
	journeys, err := s.queries.ListJourneysByDate(ctx, date)
	if err != nil {
		return nil, err
	}
	if journeys == nil {
		journeys = []db.TrainJourney{}
	}
	return journeys, nil
}
