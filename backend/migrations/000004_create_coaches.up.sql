CREATE TABLE IF NOT EXISTS coaches (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_number   VARCHAR(10) NOT NULL,
    coach_type_id  UUID NOT NULL REFERENCES coach_types(id)
);