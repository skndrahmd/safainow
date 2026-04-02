-- Add sort_order column to packages table for admin-controlled ordering
ALTER TABLE packages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_packages_sort_order ON packages(sort_order);

-- Backfill existing packages using created_at order (preserves current display order)
UPDATE packages SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS row_num
  FROM packages
) AS subquery
WHERE packages.id = subquery.id;

-- Create function to auto-assign sort_order for new packages
CREATE OR REPLACE FUNCTION set_package_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order = 0 THEN
    NEW.sort_order := COALESCE(
      (SELECT MAX(sort_order) + 1 FROM packages),
      0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assigning sort_order on insert
CREATE TRIGGER packages_sort_order_trigger
  BEFORE INSERT ON packages
  FOR EACH ROW EXECUTE FUNCTION set_package_sort_order();