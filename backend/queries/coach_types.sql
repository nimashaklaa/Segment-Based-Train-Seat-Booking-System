-- name: ListCoachTypes :many
SELECT id, name, is_reserved, seat_capacity
FROM coach_types
ORDER BY name;

-- name: GetCoachType :one
SELECT id, name, is_reserved, seat_capacity
FROM coach_types
WHERE id = $1;