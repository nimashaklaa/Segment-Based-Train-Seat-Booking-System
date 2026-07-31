CREATE TABLE IF NOT EXISTS routes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(10)  UNIQUE NOT NULL,
    origin      VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL
);