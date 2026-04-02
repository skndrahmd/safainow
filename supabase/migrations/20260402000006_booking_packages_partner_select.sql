-- Allow partners to read booking_packages for their assigned jobs
CREATE POLICY "booking_packages: select partner"
ON booking_packages
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT booking_id FROM job_offers jo
    JOIN partners p ON jo.partner_id = p.id
    WHERE p.auth_user_id = auth.uid()
  )
  OR booking_id IN (
    SELECT id FROM bookings WHERE partner_id IN (
      SELECT id FROM partners WHERE auth_user_id = auth.uid()
    )
  )
);

-- Allow partners to read booking_custom_services for their assigned jobs
CREATE POLICY "booking_custom_services: select partner"
ON booking_custom_services
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT booking_id FROM job_offers jo
    JOIN partners p ON jo.partner_id = p.id
    WHERE p.auth_user_id = auth.uid()
  )
  OR booking_id IN (
    SELECT id FROM bookings WHERE partner_id IN (
      SELECT id FROM partners WHERE auth_user_id = auth.uid()
    )
  )
);