# Supabase read/write access

## 1. Use Supabase MCP in Cursor

- **Config added:** `.cursor/mcp.json` is set to the Supabase MCP with your project (`project_ref=gwkeasdxzjfaebeyvwmh`).
- **Connect:** Restart Cursor (or reload MCP). When you use Supabase tools, you may be prompted to log in to Supabase and grant access.
- **Verify:** In Cursor go to **Settings → Cursor Settings → Tools & MCP** and confirm the `supabase` server is connected. Then you can ask the AI to “list tables” or “run get_advisors” using the Supabase MCP.

## 2. Fix “User was denied access” (app read/write)

### A. Connection string

- Use the **direct** Postgres URL (not the pooler) with the **postgres** user:
  - Supabase Dashboard → **Project Settings → Database**.
  - Copy **Connection string → URI** and use the **direct** one:  
    `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`  
    or the **Session mode** / direct host:  
    `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- In `.env` set:
  - `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.gwkeasdxzjfaebeyvwmh.supabase.co:5432/postgres?sslmode=require"`
- The `postgres` user is not restricted by RLS; if you use another user, RLS will apply.

### B. Ensure the table exists

- From the app folder run:
  - `npx prisma db push`  
  or, if you use migrations:
  - `npx prisma migrate deploy`
- Or in Supabase: **SQL Editor** → run the migration SQL that creates the `Review` table.

### C. RLS (Row Level Security)

- If the app connects as a **non‑postgres** user (e.g. through pooler with a limited user), RLS can block reads/writes.
- Either:
  - **Option 1:** Run `scripts/fix-supabase-rls.sql` in the Supabase **SQL Editor** (disables RLS on `Review` or adds a permissive policy), or
  - **Option 2:** Use Supabase MCP: ask the AI to run `execute_sql` with the contents of `scripts/fix-supabase-rls.sql`.

After this, the app’s read/write to the `Review` table should work. If you use Supabase MCP, we can also run `list_tables` and `get_advisors` to double‑check schema and security.
