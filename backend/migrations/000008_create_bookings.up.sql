CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id         UUID NOT NULL REFERENCES train_journeys(id),
    seat_id            UUID NOT NULL REFERENCES seats(id),
    board_station_id   UUID NOT NULL REFERENCES stations(id),
    alight_station_id  UUID NOT NULL REFERENCES stations(id),
    board_sequence     INT NOT NULL,
    alight_sequence    INT NOT NULL,
    station_range      INT4RANGE GENERATED ALWAYS AS (
                           int4range(board_sequence, alight_sequence, '[)')
                       ) STORED,
    passenger_name     VARCHAR(100) NOT NULL,
    passenger_email    VARCHAR(255) NOT NULL,
    fare               DECIMAL(8, 2) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_station_order CHECK (board_sequence < alight_sequence),
    CONSTRAINT no_overlapping_seat_bookings EXCLUDE USING gist (
        journey_id    WITH =,
        seat_id       WITH =,
        station_range WITH &&
    ) WHERE (status = 'CONFIRMED')
);