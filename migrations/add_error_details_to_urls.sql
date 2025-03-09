-- Add error_details column to urls table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'urls'
        AND column_name = 'error_details'
    ) THEN
        ALTER TABLE urls ADD COLUMN error_details TEXT;
    END IF;
END $$; 