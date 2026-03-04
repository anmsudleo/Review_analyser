-- Run this in Supabase SQL Editor (or via Supabase MCP execute_sql) to fix read/write access.
-- Use this if the app connects with a role that is subject to RLS (e.g. not the postgres superuser).

-- Ensure we're in public schema
SET search_path TO public;

-- If RLS is enabled on "Review", either disable it for the app role or add a permissive policy.

-- Option A: Disable RLS on the Review table (simplest for a backend-only app using one role)
ALTER TABLE IF EXISTS "Review" DISABLE ROW LEVEL SECURITY;

-- Option B: If you prefer to keep RLS enabled, uncomment below and comment Option A:
-- ALTER TABLE IF EXISTS "Review" ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow full access for service role" ON "Review";
-- CREATE POLICY "Allow full access for service role" ON "Review"
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Grant usage on schema and full rights on the table (in case a custom role is used)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON TABLE public."Review" TO postgres;
