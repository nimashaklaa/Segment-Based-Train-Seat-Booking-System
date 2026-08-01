-- name: ListCoachesByType :many
SELECT id, coach_number, coach_type_id
FROM coaches
WHERE coach_type_id = $1
ORDER BY coach_number;

-- name: GetCoach :one
SELECT id, coach_number, coach_type_id
FROM coaches
WHERE id = $1;