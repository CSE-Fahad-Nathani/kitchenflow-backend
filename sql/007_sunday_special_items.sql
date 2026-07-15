CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sunday_special_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    special_id UUID NOT NULL REFERENCES sunday_specials(special_id) ON DELETE CASCADE,

    dish_name VARCHAR(255) NOT NULL,

    quantity VARCHAR(100) NOT NULL,

    price NUMERIC(10,2) NOT NULL,

    note TEXT DEFAULT '',

    display_order INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);