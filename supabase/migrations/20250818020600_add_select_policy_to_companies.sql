CREATE POLICY "allow_read_for_authenticated_users" ON "public"."companies" FOR SELECT TO "authenticated" USING (true);
