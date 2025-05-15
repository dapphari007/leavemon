-- Add daysAllowed column to leave_types table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leave_types' 
        AND column_name = 'daysAllowed'
    ) THEN
        ALTER TABLE leave_types ADD COLUMN "daysAllowed" integer DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added daysAllowed column to leave_types table';
    ELSE
        RAISE NOTICE 'daysAllowed column already exists in leave_types table';
    END IF;
END $$;