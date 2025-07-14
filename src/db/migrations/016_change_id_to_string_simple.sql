-- Change all id columns from UUID to VARCHAR(20) to support string IDs
-- This migration will update the data type for all tables and their foreign keys

-- First, drop all foreign key constraints for existing tables
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_id_fkey;
ALTER TABLE escalation_types DROP CONSTRAINT IF EXISTS escalation_types_tenant_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_tenant_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_agent_id_fkey;
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_tenant_id_fkey;
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_tenant_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_ticket_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_started_by_user_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_assigned_agent_id_fkey;
ALTER TABLE chat_msgs DROP CONSTRAINT IF EXISTS chat_msgs_chat_id_fkey;
ALTER TABLE chat_msgs DROP CONSTRAINT IF EXISTS chat_msgs_sender_id_fkey;
ALTER TABLE recordings DROP CONSTRAINT IF EXISTS recordings_tenant_id_fkey;
ALTER TABLE recordings DROP CONSTRAINT IF EXISTS recordings_ticket_id_fkey;
ALTER TABLE recordings DROP CONSTRAINT IF EXISTS recordings_chat_id_fkey;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_tenant_id_fkey;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_ticket_id_fkey;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_chat_id_fkey;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_user_id_fkey;
ALTER TABLE escalations DROP CONSTRAINT IF EXISTS escalations_ticket_id_fkey;
ALTER TABLE escalations DROP CONSTRAINT IF EXISTS escalations_raised_by_user_id_fkey;
ALTER TABLE escalations DROP CONSTRAINT IF EXISTS escalations_type_id_fkey;
-- Recent activities table removed - no longer needed

-- Change all id columns from UUID to VARCHAR(20) for existing tables
ALTER TABLE tenants ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE categories ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE escalation_types ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE tickets ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE templates ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE chats ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE chat_msgs ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE recordings ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE communications ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE escalations ALTER COLUMN id TYPE VARCHAR(20);
-- Recent activities table removed - no longer needed

-- Change all foreign key columns from UUID to VARCHAR(20) for existing tables
ALTER TABLE categories ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE escalation_types ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE users ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE tickets ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE tickets ALTER COLUMN category_id TYPE VARCHAR(20);
ALTER TABLE tickets ALTER COLUMN customer_id TYPE VARCHAR(20);
ALTER TABLE tickets ALTER COLUMN agent_id TYPE VARCHAR(20);
ALTER TABLE templates ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE templates ALTER COLUMN category_id TYPE VARCHAR(20);
ALTER TABLE chats ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE chats ALTER COLUMN ticket_id TYPE VARCHAR(20);
ALTER TABLE chats ALTER COLUMN started_by_user_id TYPE VARCHAR(20);
ALTER TABLE chats ALTER COLUMN assigned_agent_id TYPE VARCHAR(20);
ALTER TABLE chat_msgs ALTER COLUMN chat_id TYPE VARCHAR(20);
ALTER TABLE chat_msgs ALTER COLUMN sender_id TYPE VARCHAR(20);
ALTER TABLE recordings ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE recordings ALTER COLUMN ticket_id TYPE VARCHAR(20);
ALTER TABLE recordings ALTER COLUMN chat_id TYPE VARCHAR(20);
ALTER TABLE communications ALTER COLUMN tenant_id TYPE VARCHAR(20);
ALTER TABLE communications ALTER COLUMN ticket_id TYPE VARCHAR(20);
ALTER TABLE communications ALTER COLUMN chat_id TYPE VARCHAR(20);
ALTER TABLE communications ALTER COLUMN user_id TYPE VARCHAR(20);
ALTER TABLE escalations ALTER COLUMN ticket_id TYPE VARCHAR(20);
ALTER TABLE escalations ALTER COLUMN raised_by_user_id TYPE VARCHAR(20);
ALTER TABLE escalations ALTER COLUMN type_id TYPE VARCHAR(20);
-- Recent activities table removed - no longer needed

-- Re-add all foreign key constraints for existing tables
ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE escalation_types ADD CONSTRAINT escalation_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD CONSTRAINT tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD CONSTRAINT tickets_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE templates ADD CONSTRAINT templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE templates ADD CONSTRAINT templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE chats ADD CONSTRAINT chats_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE chats ADD CONSTRAINT chats_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
ALTER TABLE chats ADD CONSTRAINT chats_started_by_user_id_fkey FOREIGN KEY (started_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE chats ADD CONSTRAINT chats_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE chat_msgs ADD CONSTRAINT chat_msgs_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
ALTER TABLE chat_msgs ADD CONSTRAINT chat_msgs_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE recordings ADD CONSTRAINT recordings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE recordings ADD CONSTRAINT recordings_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
ALTER TABLE recordings ADD CONSTRAINT recordings_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
ALTER TABLE communications ADD CONSTRAINT communications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE communications ADD CONSTRAINT communications_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
ALTER TABLE communications ADD CONSTRAINT communications_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL;
ALTER TABLE communications ADD CONSTRAINT communications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE escalations ADD CONSTRAINT escalations_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
ALTER TABLE escalations ADD CONSTRAINT escalations_raised_by_user_id_fkey FOREIGN KEY (raised_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE escalations ADD CONSTRAINT escalations_type_id_fkey FOREIGN KEY (type_id) REFERENCES escalation_types(id) ON DELETE CASCADE;
-- Recent activities table removed - no longer needed 