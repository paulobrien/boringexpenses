/*
  # Add Expense Categories

  1. New Tables
    - `expense_categories`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text, category name)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `category_id` to `expenses` table
    - Update company creation trigger to create default categories

  3. Security
    - Enable RLS on `expense_categories` table
    - Add policies for company-based access
    - Update expenses policies to handle categories

  4. Default Categories
    - 10 sample categories created for each new company
    - Categories are company-specific and isolated
*/

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Add category_id to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add updated_at trigger for expense_categories
CREATE TRIGGER handle_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS Policies for expense_categories
CREATE POLICY "Users can read own company categories"
  ON expense_categories
  FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "Users can insert own company categories"
  ON expense_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "Users can update own company categories"
  ON expense_categories
  FOR UPDATE
  TO authenticated
  USING (company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ));

CREATE POLICY "Users can delete own company categories"
  ON expense_categories
  FOR DELETE
  TO authenticated
  USING (company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ));

-- Function to create default expense categories for a company
CREATE OR REPLACE FUNCTION create_default_expense_categories(company_id_param uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO expense_categories (company_id, name) VALUES
    (company_id_param, 'Meals & Entertainment'),
    (company_id_param, 'Transportation'),
    (company_id_param, 'Accommodation'),
    (company_id_param, 'Office Supplies'),
    (company_id_param, 'Software & Subscriptions'),
    (company_id_param, 'Marketing & Advertising'),
    (company_id_param, 'Professional Services'),
    (company_id_param, 'Training & Development'),
    (company_id_param, 'Equipment & Hardware'),
    (company_id_param, 'Miscellaneous');
END;
$$ LANGUAGE plpgsql;

-- Update the user creation trigger to also create default categories
CREATE OR REPLACE FUNCTION create_user_company_and_profile()
RETURNS TRIGGER AS $$
DECLARE
  company_id_var uuid;
  company_name_var text;
BEGIN
  -- Extract domain from email for company name
  company_name_var := COALESCE(
    split_part(NEW.email, '@', 2) || ' Company',
    'My Company'
  );
  
  -- Create company
  INSERT INTO companies (name) 
  VALUES (company_name_var)
  RETURNING id INTO company_id_var;
  
  -- Create user profile
  INSERT INTO profiles (id, company_id, full_name)
  VALUES (NEW.id, company_id_var, '');
  
  -- Create default expense categories
  PERFORM create_default_expense_categories(company_id_var);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default categories for existing companies that don't have any
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN 
    SELECT c.id 
    FROM companies c 
    LEFT JOIN expense_categories ec ON c.id = ec.company_id 
    WHERE ec.id IS NULL
    GROUP BY c.id
  LOOP
    PERFORM create_default_expense_categories(company_record.id);
  END LOOP;
END $$;