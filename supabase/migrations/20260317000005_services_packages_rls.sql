-- Services, packages, and package_services are admin-managed.
-- The admin panel is a separate Next.js app. Customers and partners
-- use separate mobile apps with their own Supabase clients and never
-- reach these tables. "authenticated" here means the admin who logged
-- in via the admin login page — consistent with the partners table
-- policy in migration 20260317000004_admin_rls_policies.sql.

alter table services enable row level security;
alter table packages enable row level security;
alter table package_services enable row level security;

create policy "Authenticated users have full access to services"
on services for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to packages"
on packages for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to package_services"
on package_services for all
to authenticated
using (true)
with check (true);
