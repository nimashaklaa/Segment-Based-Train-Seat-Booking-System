package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/nimashaklaa/train-seat-booking/internal/db"
)

// ── Routes ──────────────────────────────────────────────────────────────────

func (s *Service) ListRoutes(ctx context.Context) ([]db.Route, error) {
	rows, err := s.rawDB.QueryContext(ctx,
		`SELECT id, name, code, origin, destination FROM routes ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var routes []db.Route
	for rows.Next() {
		var r db.Route
		if err := rows.Scan(&r.ID, &r.Name, &r.Code, &r.Origin, &r.Destination); err != nil {
			return nil, err
		}
		routes = append(routes, r)
	}
	if routes == nil {
		routes = []db.Route{}
	}
	return routes, nil
}

func (s *Service) CreateRoute(ctx context.Context, name, code, origin, destination string) (db.Route, error) {
	if name == "" || origin == "" || destination == "" {
		return db.Route{}, fmt.Errorf("name, origin and destination are required: %w", ErrInvalid)
	}
	var r db.Route
	err := s.rawDB.QueryRowContext(ctx,
		`INSERT INTO routes (name, code, origin, destination)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, code, origin, destination`,
		name, code, origin, destination,
	).Scan(&r.ID, &r.Name, &r.Code, &r.Origin, &r.Destination)
	if err != nil {
		if isUniqueViolation(err) {
			return db.Route{}, fmt.Errorf("a route with this code already exists: %w", ErrConflict)
		}
		return db.Route{}, err
	}
	return r, nil
}

func (s *Service) UpdateRoute(ctx context.Context, id, name, code, origin, destination string) (db.Route, error) {
	if name == "" || origin == "" || destination == "" {
		return db.Route{}, fmt.Errorf("name, origin and destination are required: %w", ErrInvalid)
	}
	var r db.Route
	err := s.rawDB.QueryRowContext(ctx,
		`UPDATE routes SET name=$1, code=$2, origin=$3, destination=$4 WHERE id=$5
		 RETURNING id, name, code, origin, destination`,
		name, code, origin, destination, id,
	).Scan(&r.ID, &r.Name, &r.Code, &r.Origin, &r.Destination)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.Route{}, fmt.Errorf("route: %w", ErrNotFound)
		}
		return db.Route{}, err
	}
	return r, nil
}

// ── Train Schedules ─────────────────────────────────────────────────────────

func (s *Service) ListSchedules(ctx context.Context) ([]db.TrainSchedule, error) {
	rows, err := s.rawDB.QueryContext(ctx,
		`SELECT id, train_number, route_id, departure_time FROM train_schedules ORDER BY departure_time`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var schedules []db.TrainSchedule
	for rows.Next() {
		var sc db.TrainSchedule
		if err := rows.Scan(&sc.ID, &sc.TrainNumber, &sc.RouteID, &sc.DepartureTime); err != nil {
			return nil, err
		}
		schedules = append(schedules, sc)
	}
	if schedules == nil {
		schedules = []db.TrainSchedule{}
	}
	return schedules, nil
}

func (s *Service) CreateSchedule(ctx context.Context, trainNumber, routeID, departureTimeStr string) (db.TrainSchedule, error) {
	if trainNumber == "" || routeID == "" || departureTimeStr == "" {
		return db.TrainSchedule{}, fmt.Errorf("train_number, route_id and departure_time are required: %w", ErrInvalid)
	}
	depTime, err := time.Parse("15:04", departureTimeStr)
	if err != nil {
		return db.TrainSchedule{}, fmt.Errorf("departure_time must be HH:MM: %w", ErrInvalid)
	}
	// Store as a fixed date with just the time component
	depTimeUTC := time.Date(1970, 1, 1, depTime.Hour(), depTime.Minute(), 0, 0, time.UTC)
	var sc db.TrainSchedule
	err = s.rawDB.QueryRowContext(ctx,
		`INSERT INTO train_schedules (train_number, route_id, departure_time)
		 VALUES ($1, $2, $3)
		 RETURNING id, train_number, route_id, departure_time`,
		trainNumber, routeID, depTimeUTC,
	).Scan(&sc.ID, &sc.TrainNumber, &sc.RouteID, &sc.DepartureTime)
	if err != nil {
		if isUniqueViolation(err) {
			return db.TrainSchedule{}, fmt.Errorf("a schedule with this train number already exists: %w", ErrConflict)
		}
		return db.TrainSchedule{}, err
	}
	return sc, nil
}

func (s *Service) UpdateSchedule(ctx context.Context, id, trainNumber, departureTimeStr string) (db.TrainSchedule, error) {
	if trainNumber == "" || departureTimeStr == "" {
		return db.TrainSchedule{}, fmt.Errorf("train_number and departure_time are required: %w", ErrInvalid)
	}
	depTime, err := time.Parse("15:04", departureTimeStr)
	if err != nil {
		return db.TrainSchedule{}, fmt.Errorf("departure_time must be HH:MM: %w", ErrInvalid)
	}
	depTimeUTC := time.Date(1970, 1, 1, depTime.Hour(), depTime.Minute(), 0, 0, time.UTC)
	var sc db.TrainSchedule
	err = s.rawDB.QueryRowContext(ctx,
		`UPDATE train_schedules SET train_number=$1, departure_time=$2 WHERE id=$3
		 RETURNING id, train_number, route_id, departure_time`,
		trainNumber, depTimeUTC, id,
	).Scan(&sc.ID, &sc.TrainNumber, &sc.RouteID, &sc.DepartureTime)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.TrainSchedule{}, fmt.Errorf("schedule: %w", ErrNotFound)
		}
		return db.TrainSchedule{}, err
	}
	return sc, nil
}

func (s *Service) DeleteSchedule(ctx context.Context, id string) error {
	res, err := s.rawDB.ExecContext(ctx, `DELETE FROM train_schedules WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("schedule: %w", ErrNotFound)
	}
	return nil
}

// ── Train Journeys ───────────────────────────────────────────────────────────

func (s *Service) ListAllJourneys(ctx context.Context) ([]db.TrainJourney, error) {
	rows, err := s.rawDB.QueryContext(ctx,
		`SELECT id, schedule_id, travel_date, status FROM train_journeys ORDER BY travel_date DESC, schedule_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var journeys []db.TrainJourney
	for rows.Next() {
		var j db.TrainJourney
		if err := rows.Scan(&j.ID, &j.ScheduleID, &j.TravelDate, &j.Status); err != nil {
			return nil, err
		}
		journeys = append(journeys, j)
	}
	if journeys == nil {
		journeys = []db.TrainJourney{}
	}
	return journeys, nil
}

func (s *Service) CreateJourney(ctx context.Context, scheduleID, travelDate string) (db.TrainJourney, error) {
	if scheduleID == "" || travelDate == "" {
		return db.TrainJourney{}, fmt.Errorf("schedule_id and travel_date are required: %w", ErrInvalid)
	}
	date, err := time.Parse("2006-01-02", travelDate)
	if err != nil {
		return db.TrainJourney{}, fmt.Errorf("travel_date must be YYYY-MM-DD: %w", ErrInvalid)
	}
	var j db.TrainJourney
	err = s.rawDB.QueryRowContext(ctx,
		`INSERT INTO train_journeys (schedule_id, travel_date, status)
		 VALUES ($1, $2, 'scheduled')
		 RETURNING id, schedule_id, travel_date, status`,
		scheduleID, date,
	).Scan(&j.ID, &j.ScheduleID, &j.TravelDate, &j.Status)
	if err != nil {
		if isUniqueViolation(err) {
			return db.TrainJourney{}, fmt.Errorf("a journey for this schedule and date already exists: %w", ErrConflict)
		}
		return db.TrainJourney{}, err
	}
	return j, nil
}

func (s *Service) UpdateJourneyStatus(ctx context.Context, id, status string) (db.TrainJourney, error) {
	allowed := map[string]bool{"scheduled": true, "completed": true, "cancelled": true}
	if !allowed[status] {
		return db.TrainJourney{}, fmt.Errorf("status must be scheduled, completed or cancelled: %w", ErrInvalid)
	}
	var j db.TrainJourney
	err := s.rawDB.QueryRowContext(ctx,
		`UPDATE train_journeys SET status=$1 WHERE id=$2
		 RETURNING id, schedule_id, travel_date, status`,
		status, id,
	).Scan(&j.ID, &j.ScheduleID, &j.TravelDate, &j.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return db.TrainJourney{}, fmt.Errorf("journey: %w", ErrNotFound)
		}
		return db.TrainJourney{}, err
	}
	return j, nil
}

// ── Coaches ──────────────────────────────────────────────────────────────────

type CoachRow struct {
	ID            string `json:"id"`
	CoachNumber   string `json:"coach_number"`
	CoachTypeID   string `json:"coach_type_id"`
	CoachTypeName string `json:"coach_type_name"`
	SeatCapacity  int32  `json:"seat_capacity"`
}

func (s *Service) ListAllCoaches(ctx context.Context) ([]CoachRow, error) {
	rows, err := s.rawDB.QueryContext(ctx,
		`SELECT c.id, c.coach_number, c.coach_type_id, ct.name, ct.seat_capacity
		 FROM coaches c JOIN coach_types ct ON c.coach_type_id = ct.id
		 ORDER BY ct.name, c.coach_number`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var coaches []CoachRow
	for rows.Next() {
		var c CoachRow
		if err := rows.Scan(&c.ID, &c.CoachNumber, &c.CoachTypeID, &c.CoachTypeName, &c.SeatCapacity); err != nil {
			return nil, err
		}
		coaches = append(coaches, c)
	}
	if coaches == nil {
		coaches = []CoachRow{}
	}
	return coaches, nil
}

func (s *Service) ListCoachTypes(ctx context.Context) ([]db.CoachType, error) {
	rows, err := s.rawDB.QueryContext(ctx,
		`SELECT id, name, is_reserved, seat_capacity FROM coach_types ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var types []db.CoachType
	for rows.Next() {
		var ct db.CoachType
		if err := rows.Scan(&ct.ID, &ct.Name, &ct.IsReserved, &ct.SeatCapacity); err != nil {
			return nil, err
		}
		types = append(types, ct)
	}
	if types == nil {
		types = []db.CoachType{}
	}
	return types, nil
}

func (s *Service) CreateCoach(ctx context.Context, coachNumber, coachTypeID string) (db.Coach, error) {
	if coachNumber == "" || coachTypeID == "" {
		return db.Coach{}, fmt.Errorf("coach_number and coach_type_id are required: %w", ErrInvalid)
	}
	var c db.Coach
	err := s.rawDB.QueryRowContext(ctx,
		`INSERT INTO coaches (coach_number, coach_type_id)
		 VALUES ($1, $2)
		 RETURNING id, coach_number, coach_type_id`,
		coachNumber, coachTypeID,
	).Scan(&c.ID, &c.CoachNumber, &c.CoachTypeID)
	if err != nil {
		if isUniqueViolation(err) {
			return db.Coach{}, fmt.Errorf("a coach with this number already exists: %w", ErrConflict)
		}
		return db.Coach{}, err
	}
	return c, nil
}

func (s *Service) DeleteCoach(ctx context.Context, id string) error {
	res, err := s.rawDB.ExecContext(ctx, `DELETE FROM coaches WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("coach: %w", ErrNotFound)
	}
	return nil
}
