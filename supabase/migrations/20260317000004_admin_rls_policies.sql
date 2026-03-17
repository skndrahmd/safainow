-- Admin panel uses the anon key + authenticated session (cookie-based Supabase Auth).
-- Authenticated users in this context are admins — give them full access to all tables
-- they need to manage.

-- partners
alter table partners enable row level security;

create policy "Authenticated users have full access to partners"
on partners for all
to authenticated
using (true)
with check (true);
