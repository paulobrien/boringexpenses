-- Drop the existing permissive company update policy
DROP POLICY IF EXISTS "Users can update own company" ON companies;

-- Create a new policy that only allows admins to update company name
CREATE POLICY "Only admins can update company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
