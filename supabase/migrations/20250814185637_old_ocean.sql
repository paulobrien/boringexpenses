/*
  # Add Companies Support

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, company name)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to Existing Tables
    - `profiles` table gets `company_id` foreign key

  3. Security
    - Enable RLS on `companies` table
    - Add policies for company access
    - Update profiles policies to include company context

  4. Functions
    - Create function to automatically create company and associate user profile
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Company',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_company_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add updated_at trigger for companies
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'handle_companies_updated_at'
  ) THEN
    CREATE TRIGGER handle_companies_updated_at
      BEFORE UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Company policies
CREATE POLICY "Users can read own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to create company and associate profile
CREATE OR REPLACE FUNCTION create_user_company_and_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id uuid;
  company_name text;
BEGIN
  -- Generate company name from email domain or use default
  company_name := COALESCE(
    split_part(NEW.email, '@', 2) || ' Company',
    'My Company'
  );
  
  -- Create a new company for the user
  INSERT INTO companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;
  
  -- Create or update the user profile with the company
  INSERT INTO profiles (id, full_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_company_id
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = new_company_id,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic company and profile creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created_company'
  ) THEN
    CREATE TRIGGER on_auth_user_created_company
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_user_company_and_profile();
  END IF;
END $$;