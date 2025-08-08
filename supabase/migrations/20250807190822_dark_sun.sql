/*
  # Add image support to expenses

  1. Changes
    - Add `image_url` column to expenses table to store uploaded image URLs
    - Column is optional (nullable) so existing expenses aren't affected

  2. Security
    - No changes to RLS policies needed as image_url follows same user ownership rules
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE expenses ADD COLUMN image_url text;
  END IF;
END $$;