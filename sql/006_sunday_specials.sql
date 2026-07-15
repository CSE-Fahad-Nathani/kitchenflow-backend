CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sunday_specials (
    special_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    special_date DATE NOT NULL,

    title VARCHAR(100) DEFAULT 'Sunday Special',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEAN DEFAULT FALSE
);