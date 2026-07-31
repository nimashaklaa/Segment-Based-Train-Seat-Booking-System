CREATE TABLE IF NOT EXISTS train_schedules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_number   VARCHAR(20) UNIQUE NOT NULL,
    route_id       UUID NOT NULL REFERENCES routes(id),
    departure_time TIME NOT NULL
);