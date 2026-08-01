-- name: CreateBooking :one
INSERT INTO bookings (
    journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email, fare
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    fare, status, created_at;

-- name: GetBooking :one
SELECT
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    fare, status, created_at
FROM bookings
WHERE id = $1;

-- name: ListBookingsByJourney :many
SELECT
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    fare, status, created_at
FROM bookings
WHERE journey_id = $1
ORDER BY created_at;

-- name: CancelBooking :one
UPDATE bookings
SET status = 'CANCELLED'
WHERE id = $1
RETURNING
    id, journey_id, seat_id, board_station_id, alight_station_id,
    board_sequence, alight_sequence, passenger_name, passenger_email,
    fare, status, created_at;

-- name: GetAvailableSeats :many
SELECT s.id, s.coach_id, s.seat_number, s.row_num, s.col_num
FROM seats s
JOIN coaches c ON c.id = s.coach_id
WHERE c.coach_type_id = $1
AND s.id NOT IN (
    SELECT b.seat_id
    FROM bookings b
    WHERE b.journey_id = $2
    AND b.status = 'CONFIRMED'
    AND b.board_sequence < $4
    AND b.alight_sequence > $3
)
ORDER BY s.row_num, s.col_num;