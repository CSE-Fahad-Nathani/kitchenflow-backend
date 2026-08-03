CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Multi-dish support for monthly tiffin bills
CREATE TABLE IF NOT EXISTS monthly_tiffin_bill_dishes (
    dish_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bill_id UUID NOT NULL REFERENCES monthly_tiffin_bills(bill_id) ON DELETE CASCADE,

    dish_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),

    rate_per_day NUMERIC(10,2) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    delivery_charge_per_day NUMERIC(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monthly_tiffin_bill_dishes_bill_id
  ON monthly_tiffin_bill_dishes(bill_id);

-- Migrate existing single-dish bills into the dishes table
INSERT INTO monthly_tiffin_bill_dishes (
  bill_id,
  dish_name,
  variant_name,
  rate_per_day,
  quantity,
  delivery_charge_per_day
)
SELECT
  bill_id,
  dish_name,
  variant_name,
  rate_per_day,
  COALESCE(quantity, 1),
  COALESCE(delivery_charge, 0)
FROM monthly_tiffin_bills b
WHERE
  b.is_deleted = FALSE
  AND b.dish_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM monthly_tiffin_bill_dishes d
    WHERE d.bill_id = b.bill_id
  );

-- Legacy columns become optional (kept for older rows / soft fallback)
ALTER TABLE monthly_tiffin_bills
  ALTER COLUMN dish_name DROP NOT NULL,
  ALTER COLUMN rate_per_day DROP NOT NULL;
