-- name: ListRoutes :many
SELECT id, name, code, origin, destination
FROM routes
ORDER BY name;

-- name: GetRoute :one
SELECT id, name, code, origin, destination
FROM routes
WHERE id = $1;

-- name: GetRouteByCode :one
SELECT id, name, code, origin, destination
FROM routes
WHERE code = $1;