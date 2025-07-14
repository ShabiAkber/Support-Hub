CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    raised_by_user_id UUID NOT NULL,
    type_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (type_id) REFERENCES escalation_types(id) ON DELETE CASCADE
); 