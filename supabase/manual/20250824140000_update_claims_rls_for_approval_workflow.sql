/*
  # Update Claims RLS for Approval Workflow

  Updates the claims table RLS policies to match the expenses table exactly:
  - Admins can see all claims in their company
  - Managers can see claims from their direct reports
  - Employees can see their own claims

  This ensures consistent access controls between claims and expenses tables.
*/

-- Drop existing claims policies that might conflict
DROP POLICY IF EXISTS "Users can read claims based on role" ON claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON claims;
DROP POLICY IF EXISTS "Users can update claims based on role and status" ON claims;
DROP POLICY IF EXISTS "Users can delete own unfiled claims" ON claims;

-- New comprehensive policies for claims to match expenses table exactly
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
        AND p1.role = 'admin'
    )
  );