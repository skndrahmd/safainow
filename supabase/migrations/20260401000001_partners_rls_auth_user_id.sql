-- Allow authenticated partners to read their own row via auth_user_id
CREATE POLICY "Partners can read own profile"
  ON public.partners
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());
