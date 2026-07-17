-- Quantity of tiffins per day (e.g. 2 Veg Tiffins / day)
ALTER TABLE monthly_tiffin_bills
ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) NOT NULL DEFAULT 1;
