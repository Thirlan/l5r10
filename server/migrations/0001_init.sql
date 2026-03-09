-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gm_id TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gm_id) REFERENCES users(id)
);

-- Campaign members table (players in campaigns)
CREATE TABLE IF NOT EXISTS campaign_members (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('gm', 'player')) DEFAULT 'player',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, user_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  player_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  clan_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  honor INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('active', 'dead', 'retired')) DEFAULT 'active',
  attributes TEXT NOT NULL, -- JSON: {air, earth, fire, water, void}
  skills TEXT NOT NULL, -- JSON: skill name -> rank mapping
  advantages TEXT DEFAULT '[]', -- JSON array
  disadvantages TEXT DEFAULT '[]', -- JSON array
  equipment TEXT DEFAULT '[]', -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Battles/Encounters table
CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('setup', 'active', 'paused', 'completed')) DEFAULT 'setup',
  round INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  ended_at DATETIME,
  created_by TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Battle participants table
CREATE TABLE IF NOT EXISTS battle_participants (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  initiative_roll INTEGER,
  position_q INTEGER, -- Hex coordinate q
  position_r INTEGER, -- Hex coordinate r
  wounds INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('active', 'down', 'out')) DEFAULT 'active',
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Combat log table (stores actions during combat)
CREATE TABLE IF NOT EXISTS combat_log (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  action TEXT NOT NULL, -- move, attack, defend, etc.
  target_id TEXT, -- character being targeted
  details TEXT, -- JSON with action-specific details
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (target_id) REFERENCES characters(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_gm ON campaigns(gm_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_player ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_battles_campaign ON battles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_battle ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_combat_log_battle ON combat_log(battle_id);
