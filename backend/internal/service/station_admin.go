package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

type StationInput struct {
	RouteID              string
	Name                 string
	SequenceOrder        int32
	DistanceFromOriginKm string
}

func (s *Service) CreateStation(ctx context.Context, input StationInput) (db.Station, error) {
	if input.Name == "" || input.RouteID == "" {
		return db.Station{}, fmt.Errorf("name and route_id are required: %w", ErrInvalid)
	}
	var station db.Station
	err := s.rawDB.QueryRowContext(ctx,
		`INSERT INTO stations (route_id, name, sequence_order, distance_from_origin_km)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, route_id, name, sequence_order, distance_from_origin_km`,
		input.RouteID, input.Name, input.SequenceOrder, input.DistanceFromOriginKm,
	).Scan(&station.ID, &station.RouteID, &station.Name, &station.SequenceOrder, &station.DistanceFromOriginKm)
	if err != nil {
		if isUniqueViolation(err) {
			return db.Station{}, fmt.Errorf("a station with this sequence order already exists on this route: %w", ErrConflict)
		}
		return db.Station{}, err
	}
	return station, nil
}

func (s *Service) UpdateStation(ctx context.Context, id string, input StationInput) (db.Station, error) {
	if input.Name == "" {
		return db.Station{}, fmt.Errorf("name is required: %w", ErrInvalid)
	}
	var station db.Station
	err := s.rawDB.QueryRowContext(ctx,
		`UPDATE stations
		 SET name = $1, sequence_order = $2, distance_from_origin_km = $3
		 WHERE id = $4
		 RETURNING id, route_id, name, sequence_order, distance_from_origin_km`,
		input.Name, input.SequenceOrder, input.DistanceFromOriginKm, id,
	).Scan(&station.ID, &station.RouteID, &station.Name, &station.SequenceOrder, &station.DistanceFromOriginKm)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.Station{}, fmt.Errorf("station: %w", ErrNotFound)
		}
		if isUniqueViolation(err) {
			return db.Station{}, fmt.Errorf("a station with this sequence order already exists on this route: %w", ErrConflict)
		}
		return db.Station{}, err
	}
	return station, nil
}

func isUniqueViolation(err error) bool {
	return err != nil && (contains(err.Error(), "unique") || contains(err.Error(), "duplicate"))
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
