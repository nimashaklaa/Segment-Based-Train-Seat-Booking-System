-- name: GetJourney :one
SELECT id, schedule_id, travel_date, status
FROM train_journeys
WHERE id = $1;

-- name: GetJourneyByScheduleAndDate :one
SELECT id, schedule_id, travel_date, status
FROM train_journeys
WHERE schedule_id = $1 AND travel_date = $2;

-- name: ListJourneysByDate :many
SELECT id, schedule_id, travel_date, status
FROM train_journeys
WHERE travel_date = $1
ORDER BY status;