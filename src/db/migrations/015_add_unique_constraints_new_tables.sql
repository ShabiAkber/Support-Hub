-- Add unique constraint to templates (tenant_id, title)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_template_title_per_tenant' AND table_name = 'templates'
    ) THEN
        ALTER TABLE templates ADD CONSTRAINT unique_template_title_per_tenant UNIQUE (tenant_id, title);
    END IF;
END$$;

-- Add unique constraint to tickets (tenant_id, subject) - assuming subject should be unique per tenant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_ticket_subject_per_tenant' AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets ADD CONSTRAINT unique_ticket_subject_per_tenant UNIQUE (tenant_id, subject);
    END IF;
END$$;

-- Add unique constraint to chats (ticket_id) - one chat per ticket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_chat_per_ticket' AND table_name = 'chats'
    ) THEN
        ALTER TABLE chats ADD CONSTRAINT unique_chat_per_ticket UNIQUE (ticket_id);
    END IF;
END$$;

-- Note: chat_msgs doesn't need unique constraints as multiple messages can exist in the same chat 