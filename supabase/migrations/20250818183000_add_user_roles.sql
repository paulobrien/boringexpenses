/*
  # Add User Roles Support

  1. Add role column to profiles table
    - `role` (text, enum: 'employee', 'manager', 'admin')
    - Default to 'employee' for new users
    - 'admin' role can manage company users and settings
    - 'manager' role can approve expenses
    - 'employee' role can submit expenses

  2. Security
    - Update RLS policies to consider roles
    - Add policy for admins to manage other users in their company
*/

-- Create role enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
  END IF;
END $$;

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'employee';
  END IF;
END $$;

-- Update existing users to have 'admin' role if they are the first user of their company
-- This assumes the first user to register for a company should be an admin
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT DISTINCT ON (company_id) id 
  FROM profiles 
  WHERE company_id IS NOT NULL 
  ORDER BY company_id, created_at ASC
);

-- Add policy for company admins to view other users in their company
CREATE POLICY "Company admins can view company users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always read their own profile
    auth.uid() = id
    OR
    -- Company admins can read profiles of users in their company
    (
      EXISTS (
        SELECT 1 FROM profiles admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
        AND admin_profile.company_id = profiles.company_id
        AND admin_profile.company_id IS NOT NULL
      )
    )
  );

-- Add policy for company admins to update other users in their company
CREATE POLICY "Company admins can update company users"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Company admins can update profiles of users in their company (but not other admins)
    (
      EXISTS (
        SELECT 1 FROM profiles admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
        AND admin_profile.company_id = profiles.company_id
        AND admin_profile.company_id IS NOT NULL
        AND profiles.role != 'admin'  -- Admins cannot modify other admins
      )
    )
  );

-- Update the user creation function to set first user as admin
CREATE OR REPLACE FUNCTION create_user_company_and_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id uuid;
  company_name text;
  user_role user_role := 'employee';
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
  
  -- Set role to 'admin' since this is the first user of the company
  user_role := 'admin';
  
  -- Create or update the user profile with the company
  INSERT INTO profiles (id, full_name, company_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_company_id,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    company_id = new_company_id,
    role = user_role,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;