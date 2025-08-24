/*
  # Add Approval Workflow

  1. Changes
    - Create claim_status enum type
    - Add status column to claims table  
    - Add manager_id to profiles table for manager assignments
    - Add approval tracking fields to claims
    - Update RLS policies for approval workflow

  2. New Fields
    - claims.status: enum ('unfiled', 'filed', 'processing', 'approved', 'paid')
    - claims.approved_by: user who approved/processed the claim
    - claims.approved_at: timestamp of approval action
    - profiles.manager_id: assigned manager for approval workflow

  3. Security
    - Update RLS policies to handle approval workflow permissions
    - Ensure users can only manage claims within their authority
*/

-- Create claim status enum
DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('unfiled', 'filed', 'processing', 'approved', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add manager_id to profiles table for manager assignments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add approval workflow fields to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS status claim_status DEFAULT 'unfiled';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Update existing claims to have proper status based on filed field
UPDATE claims SET status = CASE 
  WHEN filed = true THEN 'filed'::claim_status 
  ELSE 'unfiled'::claim_status 
END WHERE status = 'unfiled';

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);

-- Function to validate claim status transitions
CREATE OR REPLACE FUNCTION validate_claim_status_transition(
  old_status claim_status,
  new_status claim_status,
  user_role user_role,
  is_claim_owner boolean,
  is_manager boolean,
  is_admin boolean
) RETURNS boolean AS $$
BEGIN
  -- Employees can only change unfiled claims
  IF user_role = 'employee' AND NOT is_admin AND NOT is_manager THEN
    RETURN old_status = 'unfiled' AND new_status IN ('unfiled', 'filed');
  END IF;
  
  -- Managers can change filed claims to processing/approved for their employees
  IF user_role = 'manager' AND is_manager AND NOT is_admin THEN
    RETURN old_status IN ('filed', 'processing') AND new_status IN ('processing', 'approved');
  END IF;
  
  -- Admins can change any status except from paid
  IF user_role = 'admin' AND is_admin THEN
    RETURN old_status != 'paid' OR new_status = 'paid';
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for claims table to handle approval workflow

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own claims" ON claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON claims;
DROP POLICY IF EXISTS "Users can update own claims" ON claims;
DROP POLICY IF EXISTS "Users can delete own claims" ON claims;

-- New comprehensive policies for approval workflow
CREATE POLICY "Users can read claims based on role"
  ON claims FOR SELECT TO authenticated
  USING (
    -- Users can always read their own claims
    user_id = auth.uid()
    OR
    -- Managers can read claims from their direct reports
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p2.manager_id = p1.id
        AND p1.role IN ('manager', 'admin')
    )
    OR
    -- Admins can read all claims in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own claims"
  ON claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update claims based on role and status"
  ON claims FOR UPDATE TO authenticated
  USING (
    -- Check if user has permission to update this claim
    user_id = auth.uid()
    OR
    -- Managers can update claims from their direct reports
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p2.manager_id = p1.id
        AND p1.role IN ('manager', 'admin')
    )
    OR
    -- Admins can update all claims in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'
    )
  )
  WITH CHECK (
    -- Validate status transitions using our function
    validate_claim_status_transition(
      (SELECT status FROM claims WHERE id = claims.id),
      status,
      (SELECT role FROM profiles WHERE id = auth.uid()),
      user_id = auth.uid(),
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = auth.uid()
          AND p2.id = claims.user_id
          AND p2.manager_id = p1.id
          AND p1.role IN ('manager', 'admin')
      ),
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = auth.uid()
          AND p2.id = claims.user_id
          AND p1.company_id = p2.company_id
          AND p1.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can delete own unfiled claims"
  ON claims FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() AND status = 'unfiled'
    OR
    -- Admins can delete unfiled claims in their company
    (status = 'unfiled' AND EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'
    ))
  );

-- Add RLS policy for manager assignments (profiles.manager_id)
CREATE POLICY "Admins can assign managers in their company"
  ON profiles FOR UPDATE TO authenticated
  USING (
    -- Only admins can assign managers
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
        AND admin_profile.company_id = profiles.company_id
    )
  );