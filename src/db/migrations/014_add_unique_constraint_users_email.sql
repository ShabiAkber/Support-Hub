-- Add unique constraint to users.email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_email' AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email);
    END IF;
END$$; 