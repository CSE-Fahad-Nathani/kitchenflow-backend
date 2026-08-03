CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Calendar Bill: multi-dish bills with free-form selected service dates per dish
CREATE TABLE IF NOT EXISTS calendar_bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID,

    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(20),

    show_dates BOOLEAN DEFAULT TRUE,

    total_amount NUMERIC(10,2) NOT NULL,

    is_paid BOOLEAN DEFAULT FALSE,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS calendar_bill_dishes (
    dish_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bill_id UUID NOT NULL REFERENCES calendar_bills(bill_id) ON DELETE CASCADE,

    dish_name VARCHAR(255) NOT NULL,

    rate_per_day NUMERIC(10,2) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    delivery_charge_per_day NUMERIC(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_bill_dish_dates (
    date_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dish_entry_id UUID NOT NULL REFERENCES calendar_bill_dishes(dish_entry_id) ON DELETE CASCADE,

    service_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (dish_entry_id, service_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_bill_dishes_bill_id
  ON calendar_bill_dishes(bill_id);

CREATE INDEX IF NOT EXISTS idx_calendar_bill_dish_dates_entry
  ON calendar_bill_dish_dates(dish_entry_id);

CREATE INDEX IF NOT EXISTS idx_calendar_bill_dish_dates_date
  ON calendar_bill_dish_dates(service_date);
