-- OAuth Providers Mapping Table
-- Links OAuth provider IDs (Google, Discord) to user accounts
-- Allows users to have multiple OAuth accounts linked

CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'google' or 'discord'
  provider_id TEXT NOT NULL,  -- OAuth provider's user ID
  email TEXT,  -- Email from OAuth provider (may differ from main account email)
  display_name TEXT,  -- Display name from OAuth provider
  avatar_url TEXT,  -- Avatar URL from OAuth provider
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  UNIQUE(provider, provider_id),  -- Prevent duplicate OAuth accounts
  UNIQUE(user_id, provider),  -- One Google, one Discord per user (can be extended)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups by provider and provider_id
CREATE INDEX IF NOT EXISTS idx_oauth_providers_lookup 
ON oauth_providers(provider, provider_id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user 
ON oauth_providers(user_id);
