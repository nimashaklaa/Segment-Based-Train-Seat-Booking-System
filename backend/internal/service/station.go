package service

import (
	"context"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

func (s *Service) ListStations(ctx context.Context, routeID string) ([]db.Station, error) {
	stations, err := s.queries.ListStationsByRoute(ctx, routeID)
	if err != nil {
		return nil, err
	}
	if stations == nil {
		stations = []db.Station{}
	}
	return stations, nil
}

func (s *Service) ListCoaches(ctx context.Context, coachTypeID string) ([]db.Coach, error) {
	coaches, err := s.queries.ListCoachesByType(ctx, coachTypeID)
	if err != nil {
		return nil, err
	}
	if coaches == nil {
		coaches = []db.Coach{}
	}
	return coaches, nil
}
