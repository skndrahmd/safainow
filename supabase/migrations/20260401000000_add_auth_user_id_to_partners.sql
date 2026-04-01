ALTER TABLE public.partners
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
