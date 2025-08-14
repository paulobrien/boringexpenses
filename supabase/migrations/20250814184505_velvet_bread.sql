/*
  # Add filed status to expenses

  1. New Column
    - `filed` (boolean, default false) - Track if expense has been filed/processed
  
  2. Changes
    - Add filed column to expenses table with default value false
    - All existing expenses will be marked as not filed by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'filed'
  ) THEN
    ALTER TABLE expenses ADD COLUMN filed boolean DEFAULT false NOT NULL;
  END IF;
END $$;