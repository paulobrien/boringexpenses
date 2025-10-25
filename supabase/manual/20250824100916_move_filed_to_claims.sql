/*
  # Move filed status from expenses to claims

  1. Changes
    - Add `filed` boolean field to `claims` table
    - Default filed to false for existing claims
    - Remove filed column from expenses (in a separate step for safety)

  2. Migration Strategy
    - Add the filed column to claims first
    - In the future, the filed column can be removed from expenses
    - This allows for gradual migration without breaking existing functionality
*/

-- Add filed column to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS filed boolean DEFAULT false;

-- Update existing claims to have filed = false (default)
UPDATE claims SET filed = false WHERE filed IS NULL;

-- Make the column NOT NULL now that all rows have a value
ALTER TABLE claims ALTER COLUMN filed SET NOT NULL;