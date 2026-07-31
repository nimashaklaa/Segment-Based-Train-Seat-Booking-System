CREATE TABLE IF NOT EXISTS seats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    row_num     INT NOT NULL,
    col_num     INT NOT NULL,
    UNIQUE(coach_id, seat_number)
);