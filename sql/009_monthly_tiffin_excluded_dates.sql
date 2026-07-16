CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE monthly_tiffin_excluded_dates (
    excluded_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bill_id UUID NOT NULL REFERENCES monthly_tiffin_bills(bill_id) ON DELETE CASCADE,

    excluded_date DATE NOT NULL,

    reason VARCHAR(100) DEFAULT '',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);