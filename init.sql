-- Crear extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla queue
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retries INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    priority INTEGER,
    locked_by VARCHAR(100),
    locked_at TIMESTAMP
);
