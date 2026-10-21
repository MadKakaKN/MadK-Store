CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    user_email character varying(255),
    user_role character varying(50),
    action character varying(100) NOT NULL,
    entity_name character varying(100) NOT NULL,
    entity_id character varying(100),
    old_values text,
    new_values text,
    ip_address character varying(45),
    user_agent character varying(500),
    note character varying(1000),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_audit_logs" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity_name ON audit_logs (entity_name);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at);
