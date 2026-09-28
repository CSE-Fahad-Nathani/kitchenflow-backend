-- Calendar Bill: optional bill-level discount (credit offset, etc.)
ALTER TABLE calendar_bills
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;
