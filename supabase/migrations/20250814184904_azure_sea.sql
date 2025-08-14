/*
  # Add Claims functionality

  1. New Tables
    - `claims`
      - `id` (uuid, primary key)  
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text, required)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes  
    - Add `claim_id` column to `expenses` table (nullable foreign key to claims)
    - Expenses can now be associated with a claim or remain unassociated

  3. Security
    - Enable RLS on `claims` table
    - Add policies for authenticated users to manage their own claims
    - Add foreign key constraint for claim_id in expenses
*/

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add claim_id to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'claim_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN claim_id uuid REFERENCES claims(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for claims
CREATE POLICY "Users can read own claims"
  ON claims
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own claims"
  ON claims
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own claims"
  ON claims
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own claims"
  ON claims
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger for claims
CREATE TRIGGER handle_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();