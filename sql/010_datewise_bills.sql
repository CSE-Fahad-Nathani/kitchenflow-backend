CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE datewise_bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID,

    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(20),

    discount NUMERIC(10,2) DEFAULT 0,

    total_amount NUMERIC(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEAN DEFAULT FALSE
);