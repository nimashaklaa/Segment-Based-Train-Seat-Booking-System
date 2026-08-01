-- name: ListStationsByRoute :many
SELECT id, route_id, name, sequence_order, distance_from_origin_km
FROM stations
WHERE route_id = $1
ORDER BY sequence_order;

-- name: GetStation :one
SELECT id, route_id, name, sequence_order, distance_from_origin_km
FROM stations
WHERE id = $1;