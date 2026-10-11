START TRANSACTION;

CREATE TABLE permissions (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    description character varying(250),
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_permissions" PRIMARY KEY (id)
);

CREATE TABLE roles (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(250),
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_roles" PRIMARY KEY (id)
);

CREATE TABLE users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    phone_number character varying(20),
    avatar_url character varying(500),
    is_active boolean NOT NULL DEFAULT TRUE,
    email_confirmed boolean NOT NULL DEFAULT FALSE,
    email_confirmation_token character varying(255),
    email_confirmation_token_expires_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_token_expires_at timestamp with time zone,
    failed_login_attempts integer NOT NULL DEFAULT 0,
    lockout_end timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_users" PRIMARY KEY (id)
);

CREATE TABLE role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    CONSTRAINT "PK_role_permissions" PRIMARY KEY (role_id, permission_id),
    CONSTRAINT "FK_role_permissions_permissions_permission_id" FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    CONSTRAINT "FK_role_permissions_roles_role_id" FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    revoked_at timestamp with time zone,
    replaced_by_token character varying(255),
    CONSTRAINT "PK_refresh_tokens" PRIMARY KEY (id),
    CONSTRAINT "FK_refresh_tokens_users_user_id" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT "PK_user_roles" PRIMARY KEY (user_id, role_id),
    CONSTRAINT "FK_user_roles_roles_role_id" FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT "FK_user_roles_users_user_id" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_permissions_code ON permissions (code);

CREATE UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens (token);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX "IX_role_permissions_permission_id" ON role_permissions (permission_id);

CREATE UNIQUE INDEX idx_roles_name ON roles (name);

CREATE INDEX "IX_user_roles_role_id" ON user_roles (role_id);

CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_phone ON users (phone_number);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261011165447_AddIdentityTables', '8.0.11');

COMMIT;

