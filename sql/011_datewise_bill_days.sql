CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE datewise_bill_days (
    day_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bill_id UUID NOT NULL REFERENCES datewise_bills(bill_id) ON DELETE CASCADE,

    bill_date DATE NOT NULL,

    delivery_charge NUMERIC(10,2) DEFAULT 0,

    note TEXT DEFAULT '',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);