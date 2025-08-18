-- Drop the old, permissive policy if it exists
DROP POLICY IF EXISTS "allow_read_for_authenticated_users" ON "public"."companies";

-- Create a new, more restrictive policy
CREATE POLICY "allow_read_for_user_company" ON "public"."companies"
FOR SELECT TO "authenticated"
USING (id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));
