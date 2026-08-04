-- name: ListSchedulesByRoute :many
SELECT id, train_number, train_name, route_id, departure_time
FROM train_schedules
WHERE route_id = $1
ORDER BY departure_time;

-- name: GetSchedule :one
SELECT id, train_number, train_name, route_id, departure_time
FROM train_schedules
WHERE id = $1;

-- name: GetScheduleByTrainNumber :one
SELECT id, train_number, train_name, route_id, departure_time
FROM train_schedules
WHERE train_number = $1;