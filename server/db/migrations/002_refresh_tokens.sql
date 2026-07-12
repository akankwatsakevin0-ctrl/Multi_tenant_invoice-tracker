-- =============================================================================
-- Migration 002: Refresh Tokens
-- Description: Adds refresh_token support for secure token rotation.
-- =============================================================================

-- =============================================================================
-- UP: Apply schema
-- =============================================================================

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- =============================================================================
-- DOWN: Rollback
-- =============================================================================

-- DROP TABLE IF EXISTS refresh_tokens;
