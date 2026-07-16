CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE datewise_bill_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    day_id UUID NOT NULL REFERENCES datewise_bill_days(day_id) ON DELETE CASCADE,

    dish_name VARCHAR(255) NOT NULL,

    variant_name VARCHAR(255),

    quantity VARCHAR(100) NOT NULL,

    price NUMERIC(10,2) NOT NULL,

    note TEXT DEFAULT '',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);