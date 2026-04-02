-- RPC function to update partner location
-- Uses SECURITY DEFINER to allow partners to update their own location
CREATE OR REPLACE FUNCTION update_partner_location(
  p_user_id UUID,
  p_latitude FLOAT,
  p_longitude FLOAT
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET last_location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography
  WHERE auth_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (partners)
GRANT EXECUTE ON FUNCTION update_partner_location(UUID, FLOAT, FLOAT) TO authenticated;