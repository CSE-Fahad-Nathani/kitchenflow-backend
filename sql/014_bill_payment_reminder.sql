-- Payment & reminder tracking for Monthly Tiffin and Date-wise bills (matches orders)

ALTER TABLE monthly_tiffin_bills
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP;

ALTER TABLE datewise_bills
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP;
