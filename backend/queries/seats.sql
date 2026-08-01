-- name: ListSeatsByCoach :many
SELECT id, coach_id, seat_number, row_num, col_num
FROM seats
WHERE coach_id = $1
ORDER BY row_num, col_num;

-- name: GetSeat :one
SELECT id, coach_id, seat_number, row_num, col_num
FROM seats
WHERE id = $1;