/*
  # Add currency field to expenses table

  1. New Column
    - `currency` (VARCHAR(3), default 'GBP') - Currency code for the expense amount
  
  2. Changes
    - Add currency column to expenses table with default value 'GBP'
    - All existing expenses will be set to GBP by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE expenses ADD COLUMN currency VARCHAR(3) DEFAULT 'GBP' NOT NULL;
  END IF;
END $$;