/*
  # Fix Role Update Security Vulnerability

  ## Problem
  The current RLS policy on profiles doesn't have a WITH CHECK clause,
  which means it doesn't prevent users from elevating their own permissions.
  
  ## Critical Security Issues:
  1. A user could potentially update their own role to 'admin'
  2. An admin from Company A could potentially modify users in Company B
  3. Users could change their own company_id to access another company
  
  ## Solution
  Add a WITH CHECK clause that ensures:
  1. Users CANNOT change their own role or company_id
  2. Admins can ONLY modify users within their own company
  3. Admins CAN create other admins (business requirement)
  4. The target user's company cannot be changed during updates

  ## Security Model
  - Users can update their own profile data (name, avatar, etc.) but NOT role/company
  - Admins can update any user in their company, including promoting to admin
  - Cross-company modifications are strictly prevented
  - Self-elevation of permissions is strictly prevented
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update profiles based on role" ON profiles;

-- Create new policy with proper WITH CHECK clause
CREATE POLICY "Users can update profiles based on role"
  ON profiles FOR UPDATE TO authenticated
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Company admins can update users in their company
    (
      is_user_admin_in_company(auth.uid(), profiles.company_id)
      AND profiles.company_id IS NOT NULL
    )
  )
  WITH CHECK (
    -- Users updating their own profile
    (
      auth.uid() = id
      -- CRITICAL: Users cannot change their own role (prevents self-elevation)
      AND role = (SELECT role FROM profiles WHERE id = auth.uid())
      -- CRITICAL: Users cannot change their own company_id (prevents company hopping)
      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
    OR
    -- Admins updating other users in their company
    (
      -- Must not be updating own profile (handled by clause above)
      auth.uid() != id
      -- CRITICAL: Admin must be in the same company as target user
      AND is_user_admin_in_company(auth.uid(), profiles.company_id)
      -- CRITICAL: Target user must remain in the same company (no cross-company transfers)
      AND company_id = (SELECT company_id FROM profiles WHERE id = profiles.id)
      -- CRITICAL: Admin must be in the same company as they claim
      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
      -- Company must not be null
      AND company_id IS NOT NULL
    )
  );

-- Add a comment to document the security model
COMMENT ON POLICY "Users can update profiles based on role" ON profiles IS 
  'Users can update their own profile but cannot change their role/company. Admins can update any user (including role) within their own company only. Self-elevation and cross-company modifications are prevented.';
