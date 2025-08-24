/*
  # Fix Infinite Recursion in RLS Policies

  The RLS policies on profiles, claims, and expenses tables are causing infinite 
  recursion because they query the profiles table from within policies applied 
  to the profiles table itself.

  This migration:
  1. Creates security definer functions to get user info without triggering RLS
  2. Recreates all RLS policies to use these functions instead of direct queries
  3. Avoids any self-referencing queries in profiles table policies
*/

-- Create security definer functions to get user info without RLS
CREATE OR REPLACE FUNCTION get_user_role_and_company(user_id uuid)
RETURNS TABLE(role user_role, company_id uuid)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT p.role, p.company_id 
  FROM profiles p 
  WHERE p.id = user_id;
$$;

CREATE OR REPLACE FUNCTION get_user_manager_id(user_id uuid)
RETURNS uuid
SECURITY DEFINER  
SET search_path = public
LANGUAGE sql AS $$
  SELECT p.manager_id 
  FROM profiles p 
  WHERE p.id = user_id;
$$;

CREATE OR REPLACE FUNCTION is_user_admin_in_company(user_id uuid, target_company_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public  
LANGUAGE sql AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles p
    WHERE p.id = user_id 
    AND p.role = 'admin'::user_role 
    AND p.company_id = target_company_id
    AND target_company_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_user_manager_of(manager_id uuid, employee_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = manager_id
    AND p2.id = employee_id  
    AND p2.manager_id = p1.id
    AND p1.role IN ('manager'::user_role, 'admin'::user_role)
  );
$$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can read claims based on role" ON claims;
DROP POLICY IF EXISTS "Users can update claims based on role" ON claims;
DROP POLICY IF EXISTS "Users can delete own claims" ON claims;

DROP POLICY IF EXISTS "Company admins can view company users" ON profiles;
DROP POLICY IF EXISTS "Company admins can update company users" ON profiles;
DROP POLICY IF EXISTS "Admins can assign managers in their company" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON profiles;

-- Recreate expenses policies using security definer functions
CREATE POLICY "Users can read expenses based on role"
  ON expenses FOR SELECT TO authenticated
  USING (
    -- Users can always read their own expenses
    user_id = auth.uid()
    OR
    -- Managers can read expenses from their direct reports
    is_user_manager_of(auth.uid(), expenses.user_id)
    OR
    -- Admins can read all expenses in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(expenses.user_id)).company_id)
    )
  );

CREATE POLICY "Users can update expenses based on role"
  ON expenses FOR UPDATE TO authenticated
  USING (
    -- Users can update their own expenses
    user_id = auth.uid()
    OR
    -- Managers can update expenses from their direct reports
    is_user_manager_of(auth.uid(), expenses.user_id)
    OR
    -- Admins can update all expenses in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(expenses.user_id)).company_id)
    )
  );

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated
  USING (
    -- Only allow deletion of own expenses
    user_id = auth.uid()
    OR
    -- Admins can delete expenses in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(expenses.user_id)).company_id)
    )
  );

-- Recreate claims policies using security definer functions
CREATE POLICY "Users can read claims based on role"
  ON claims FOR SELECT TO authenticated
  USING (
    -- Users can always read their own claims
    user_id = auth.uid()
    OR
    -- Managers can read claims from their direct reports
    is_user_manager_of(auth.uid(), claims.user_id)
    OR
    -- Admins can read all claims in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(claims.user_id)).company_id)
    )
  );

CREATE POLICY "Users can update claims based on role"
  ON claims FOR UPDATE TO authenticated
  USING (
    -- Users can update their own claims
    user_id = auth.uid()
    OR
    -- Managers can update claims from their direct reports
    is_user_manager_of(auth.uid(), claims.user_id)
    OR
    -- Admins can update all claims in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(claims.user_id)).company_id)
    )
  )
  WITH CHECK (
    -- Validate status transitions using our function
    validate_claim_status_transition(
      (SELECT status FROM claims WHERE id = claims.id),
      status,
      (SELECT (get_user_role_and_company(auth.uid())).role),
      user_id = auth.uid(),
      is_user_manager_of(auth.uid(), claims.user_id),
      (SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(claims.user_id)).company_id))
    )
  );

CREATE POLICY "Users can delete own claims"
  ON claims FOR DELETE TO authenticated
  USING (
    -- Only allow deletion of own claims
    user_id = auth.uid()
    OR
    -- Admins can delete claims in their company
    (
      SELECT is_user_admin_in_company(auth.uid(), (get_user_role_and_company(claims.user_id)).company_id)
    )
  );

-- Recreate profiles policies WITHOUT self-referencing queries
CREATE POLICY "Users can view profiles based on role"
  ON profiles FOR SELECT TO authenticated
  USING (
    -- Users can always read their own profile
    auth.uid() = id
    OR
    -- Company admins can read profiles of users in their company
    is_user_admin_in_company(auth.uid(), profiles.company_id)
  );

CREATE POLICY "Users can update profiles based on role"
  ON profiles FOR UPDATE TO authenticated
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Company admins can update non-admin users in their company
    (
      is_user_admin_in_company(auth.uid(), profiles.company_id)
      AND profiles.role != 'admin'::user_role
    )
  );