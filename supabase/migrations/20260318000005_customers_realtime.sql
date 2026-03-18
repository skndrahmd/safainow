-- Enable Realtime for the customers table so the customer app can
-- subscribe to DELETE events on its own row and auto sign-out when
-- an admin removes the customer from the database.
--
-- REPLICA IDENTITY DEFAULT already includes the primary key (id) in
-- DELETE event payloads, which is all we need for the row filter
-- `id=eq.<userId>` to work.

ALTER TABLE public.customers REPLICA IDENTITY DEFAULT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
