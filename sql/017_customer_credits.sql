CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customer overpayment / change credits (manual ledger)
CREATE TABLE IF NOT EXISTS customer_credits (
    credit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_mobile VARCHAR(50) DEFAULT '',

    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    note TEXT DEFAULT '',

    -- Linked bill that created this credit
    bill_type VARCHAR(32) NOT NULL
      CHECK (bill_type IN ('standard', 'monthly_tiffin', 'datewise', 'calendar')),
    bill_id UUID NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_credits_created_at
  ON customer_credits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_id
  ON customer_credits(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_credits_bill
  ON customer_credits(bill_type, bill_id);
