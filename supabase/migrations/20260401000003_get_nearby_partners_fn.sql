CREATE OR REPLACE FUNCTION public.get_nearby_partners(
  booking_lat DOUBLE PRECISION,
  booking_lng DOUBLE PRECISION,
  radius_metres INTEGER
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  expo_push_token TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, full_name, expo_push_token
  FROM public.partners
  WHERE
    is_active = true
    AND is_available = true
    AND location IS NOT NULL
    AND expo_push_token IS NOT NULL
    AND extensions.ST_DWithin(
      location::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(booking_lng, booking_lat), 4326)::extensions.geography,
      radius_metres
    );
$$;