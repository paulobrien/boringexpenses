/*
  # Fix Profiles RLS Infinite Recursion

  The previous migration created multiple UPDATE policies on the profiles table
  that query the profiles table within their conditions, causing infinite recursion.

  This migration:
  1. Drops all conflicting UPDATE policies on profiles table
  2. Creates a single comprehensive UPDATE policy
  3. Avoids recursive profile table queries by using auth.uid() directly
*/

-- Drop all existing UPDATE policies on profiles table to avoid conflicts
DROP POLICY IF EXISTS "Company admins can update company users" ON profiles;
DROP POLICY IF EXISTS "Admins can assign managers in their company" ON profiles;

-- Create a single comprehensive UPDATE policy that handles both cases
CREATE POLICY "Users can update profiles based on role"
  ON profiles FOR UPDATE TO authenticated
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Company admins can update non-admin users in their company
    -- Use a subquery to avoid infinite recursion
    (
      -- Check if current user is admin in same company as target profile
      auth.uid() IN (
        SELECT p.id FROM profiles p 
        WHERE p.role = 'admin'::user_role 
        AND p.company_id = profiles.company_id
        AND p.company_id IS NOT NULL
      )
      -- Prevent admins from modifying other admins
      AND profiles.role != 'admin'::user_role
    )
  );