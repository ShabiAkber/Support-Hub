-- Add unique constraint to tenants.name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_tenant_name' AND table_name = 'tenants'
    ) THEN
        ALTER TABLE tenants ADD CONSTRAINT unique_tenant_name UNIQUE (name);
    END IF;
END$$;

-- Add unique constraint to categories (tenant_id, name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_category_name_per_tenant' AND table_name = 'categories'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT unique_category_name_per_tenant UNIQUE (tenant_id, name);
    END IF;
END$$;

-- Add unique constraint to escalation_types (tenant_id, label)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_escalation_label_per_tenant' AND table_name = 'escalation_types'
    ) THEN
        ALTER TABLE escalation_types ADD CONSTRAINT unique_escalation_label_per_tenant UNIQUE (tenant_id, label);
    END IF;
END$$; 