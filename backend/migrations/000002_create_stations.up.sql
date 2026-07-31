CREATE TABLE IF NOT EXISTS stations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id                UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    sequence_order          INT NOT NULL,
    distance_from_origin_km DECIMAL(6, 2) NOT NULL,
    UNIQUE(route_id, sequence_order)
);