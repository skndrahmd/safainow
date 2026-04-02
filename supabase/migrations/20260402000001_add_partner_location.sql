-- Add last_location column to partners table for live tracking persistence
-- PostGIS geography type is in extensions schema
ALTER TABLE partners ADD COLUMN last_location extensions.geography(POINT, 4326);

-- Create index for spatial queries (useful for future location-based features)
CREATE INDEX idx_partners_last_location ON partners USING GIST (last_location);