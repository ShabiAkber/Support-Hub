CREATE TABLE IF NOT EXISTS escalation_types (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    label VARCHAR(255) NOT NULL,
    CONSTRAINT unique_escalation_label_per_tenant UNIQUE (tenant_id, label),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
); 