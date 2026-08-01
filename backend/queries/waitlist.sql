-- name: CreateWaitlistEntry :one
INSERT INTO waitlist (
    journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    status, created_at;

-- name: GetWaitlistEntry :one
SELECT
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    status, created_at
FROM waitlist
WHERE id = $1;

-- name: ListWaitlistByJourney :many
SELECT
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    status, created_at
FROM waitlist
WHERE journey_id = $1
ORDER BY created_at;

-- name: UpdateWaitlistStatus :one
UPDATE waitlist
SET status = $2
WHERE id = $1
RETURNING
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    status, created_at;