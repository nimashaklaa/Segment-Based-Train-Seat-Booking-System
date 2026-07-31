CREATE TABLE IF NOT EXISTS waitlist (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id        UUID NOT NULL REFERENCES train_journeys(id),
    seat_id           UUID NOT NULL REFERENCES seats(id),
    board_station_id  UUID NOT NULL REFERENCES stations(id),
    alight_station_id UUID NOT NULL REFERENCES stations(id),
    board_sequence    INT NOT NULL,
    alight_sequence   INT NOT NULL,
    passenger_name    VARCHAR(100) NOT NULL,
    passenger_email   VARCHAR(255) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);