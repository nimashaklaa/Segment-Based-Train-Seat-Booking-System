CREATE TABLE IF NOT EXISTS coach_types (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(50) NOT NULL,
    is_reserved   BOOLEAN NOT NULL DEFAULT TRUE,
    seat_capacity INT NOT NULL
);