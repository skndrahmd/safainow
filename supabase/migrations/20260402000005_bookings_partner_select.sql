-- Allow partners to read bookings where they have a job offer
-- This includes pending bookings they haven't accepted yet
CREATE POLICY "bookings: select partner"
ON bookings
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT booking_id FROM job_offers jo
    JOIN partners p ON jo.partner_id = p.id
    WHERE p.auth_user_id = auth.uid()
  )
  OR partner_id IN (
    SELECT id FROM partners WHERE auth_user_id = auth.uid()
  )
);