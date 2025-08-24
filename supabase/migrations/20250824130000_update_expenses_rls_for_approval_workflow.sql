/*
  # Update Expenses RLS for Approval Workflow

  Updates the expenses table RLS policies to support the approval workflow:
  - Admins can see all expenses in their company
  - Managers can see expenses from their direct reports
  - Employees can see their own expenses

  This aligns the expenses table access controls with the claims table policies.
*/

-- Drop existing expenses policies
DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- New comprehensive policies for expenses to support approval workflow
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
        AND p1.role IN ('manager', 'admin')
    )
    OR
    -- Admins can read all expenses in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

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
        AND p1.role IN ('manager', 'admin')
    )
    OR
    -- Admins can update all expenses in their company
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid()
        AND p2.id = expenses.user_id
        AND p1.company_id = p2.company_id
        AND p1.role = 'admin'
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
        AND p1.role = 'admin'
    )
  );