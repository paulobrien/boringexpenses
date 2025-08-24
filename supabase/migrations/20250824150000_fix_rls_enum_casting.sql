/*
  # Fix RLS Policies to Use Proper Enum Casting

  Updates both claims and expenses table RLS policies to use proper 
  user_role enum casting instead of text literals. This ensures 
  PostgreSQL correctly handles the role comparisons with proper type safety.

  Changes:
  - Replace 'admin' with 'admin'::user_role
  - Replace 'manager' with 'manager'::user_role  
  - Replace IN ('manager', 'admin') with IN ('manager'::user_role, 'admin'::user_role)
*/

-- Update expenses table RLS policies with proper enum casting
DROP POLICY IF EXISTS "Users can read expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can read expenses based on role"
  ON expenses FOR SELECT TO authenticated
  USING (
    -- Users can always read their own expenses
    user_id = auth.uid()
    OR
    -- Managers can read expenses from their direct reports
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p2.manager_id = p1.id
        AND p1.role IN ('manager'::user_role, 'admin'::user_role)
    )
    OR
    -- Admins can read all expenses in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
    )
  );

CREATE POLICY "Users can update expenses based on role"
  ON expenses FOR UPDATE TO authenticated
  USING (
    -- Users can update their own expenses
    user_id = auth.uid()
    OR
    -- Managers can update expenses from their direct reports (for claim assignment)
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p2.manager_id = p1.id
        AND p1.role IN ('manager'::user_role, 'admin'::user_role)
    )
    OR
    -- Admins can update all expenses in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
    )
  );

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated
  USING (
    -- Only allow deletion of own expenses
    user_id = auth.uid()
    OR
    -- Admins can delete expenses in their company (emergency cleanup)
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
    )
  );

-- Update claims table RLS policies with proper enum casting
DROP POLICY IF EXISTS "Users can read claims based on role" ON claims;
DROP POLICY IF EXISTS "Users can update claims based on role" ON claims;
DROP POLICY IF EXISTS "Users can delete own claims" ON claims;

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
        AND p1.role IN ('manager'::user_role, 'admin'::user_role)
    )
    OR
    -- Admins can read all claims in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
    )
  );

CREATE POLICY "Users can update claims based on role"
  ON claims FOR UPDATE TO authenticated
  USING (
    -- Users can update their own claims
    user_id = auth.uid()
    OR
    -- Managers can update claims from their direct reports (for approval workflow)
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p2.manager_id = p1.id
        AND p1.role IN ('manager'::user_role, 'admin'::user_role)
    )
    OR
    -- Admins can update all claims in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
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
          AND p1.role IN ('manager'::user_role, 'admin'::user_role)
      ),
      EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = auth.uid()
          AND p2.id = claims.user_id
          AND p1.company_id = p2.company_id
          AND p1.role = 'admin'::user_role
      )
    )
  );

CREATE POLICY "Users can delete own claims"
  ON claims FOR DELETE TO authenticated
  USING (
    -- Only allow deletion of own claims
    user_id = auth.uid()
    OR
    -- Admins can delete claims in their company (emergency cleanup)
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = claims.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'::user_role
    )
  );

-- Also fix the profiles table policies for consistency
DROP POLICY IF EXISTS "Company admins can view company users" ON profiles;
DROP POLICY IF EXISTS "Company admins can update company users" ON profiles;
DROP POLICY IF EXISTS "Admins can assign managers in their company" ON profiles;

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
        AND admin_profile.role = 'admin'::user_role
        AND admin_profile.company_id = profiles.company_id
        AND admin_profile.company_id IS NOT NULL
      )
    )
  );

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
        AND admin_profile.role = 'admin'::user_role
        AND admin_profile.company_id = profiles.company_id
        AND admin_profile.company_id IS NOT NULL
        AND profiles.role != 'admin'::user_role  -- Admins cannot modify other admins
      )
    )
  );

CREATE POLICY "Admins can assign managers in their company"
  ON profiles FOR UPDATE TO authenticated
  USING (
    -- Only admins can assign managers
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'::user_role
        AND admin_profile.company_id = profiles.company_id
    )
  );

-- Also update the validate_claim_status_transition function for consistency
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
  IF user_role = 'employee'::user_role AND NOT is_admin AND NOT is_manager THEN
    RETURN old_status = 'unfiled'::claim_status AND new_status IN ('unfiled'::claim_status, 'filed'::claim_status);
  END IF;
  
  -- Managers can change filed claims to processing/approved for their employees
  IF user_role = 'manager'::user_role AND is_manager AND NOT is_admin THEN
    RETURN old_status IN ('filed'::claim_status, 'processing'::claim_status) AND new_status IN ('processing'::claim_status, 'approved'::claim_status);
  END IF;
  
  -- Admins can change any status except from paid
  IF user_role = 'admin'::user_role AND is_admin THEN
    RETURN old_status != 'paid'::claim_status OR new_status = 'paid'::claim_status;
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$ LANGUAGE plpgsql;