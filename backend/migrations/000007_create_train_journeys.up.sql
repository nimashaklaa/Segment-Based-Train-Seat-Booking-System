CREATE TABLE IF NOT EXISTS train_journeys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES train_schedules(id),
    travel_date DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    UNIQUE(schedule_id, travel_date)
);