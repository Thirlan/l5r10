# D1 Database Setup

This document explains how to set up and manage the Cloudflare D1 database for the L5R Tactical RPG API.

## Overview

The L5R Tactics API uses **Cloudflare D1** for persistent data storage. D1 is a serverless SQL database built on SQLite, hosted at the edge.

## Prerequisites

- Cloudflare account with Workers enabled
- `wrangler` CLI installed and authenticated (`wrangler login`)
- Access to Cloudflare dashboard

## Database Schema

The database includes the following tables:

### Users
- `id` - Unique user identifier
- `email` - User email (unique)
- `username` - Username (unique)
- `created_at`, `updated_at` - Timestamps

### Campaigns
- `id` - Campaign identifier
- `name` - Campaign name
- `gm_id` - Game Master (links to users)
- `description` - Campaign description
- `status` - active/paused/completed
- `created_at`, `updated_at` - Timestamps

### Campaign Members
- `id` - Membership identifier
- `campaign_id` - Link to campaign
- `user_id` - Link to user
- `role` - gm/player
- `joined_at` - Timestamp

### Characters
- `id` - Character identifier
- `name` - Character name
- `player_id` - Link to player user
- `campaign_id` - Link to campaign
- `clan_id` - Character's clan
- `school_id` - Character's school
- `honor` - Honor points
- `status` - active/dead/retired
- `attributes` - JSON: {air, earth, fire, water, void}
- `skills` - JSON: skill ratings
- `advantages`, `disadvantages` - JSON arrays
- `equipment` - JSON array
- `created_at`, `updated_at` - Timestamps

### Battles
- `id` - Battle/encounter identifier
- `campaign_id` - Link to campaign
- `map_id` - Map being used
- `status` - setup/active/paused/completed
- `round` - Current combat round
- `created_at`, `started_at`, `ended_at` - Timestamps
- `created_by` - Link to user who created

### Battle Participants
- `id` - Participant identifier
- `battle_id` - Link to battle
- `character_id` - Link to character
- `initiative_roll` - Initiative value
- `position_q`, `position_r` - Hex coordinates
- `wounds` - Current wounds
- `status` - active/down/out

### Combat Log
- `id` - Log entry identifier
- `battle_id` - Link to battle
- `round` - Combat round
- `character_id` - Acting character
- `action` - Action type (move, attack, defend, etc.)
- `target_id` - Target character (if applicable)
- `details` - JSON with action details
- `timestamp` - When action occurred

## Creating the Database

### Step 1: Create Development Database

```bash
wrangler d1 create l5r-tactics-dev
```

This will output your database ID. Copy it and update `wrangler.toml`:

```toml
[[env.development.d1_databases]]
binding = "DB"
database_name = "l5r-tactics-dev"
database_id = "YOUR_DATABASE_ID_HERE"
migrations_dir = "./migrations"
```

### Step 2: Create Production Database

```bash
wrangler d1 create l5r-tactics-prod
```

Update the production section in `wrangler.toml` with the ID.

### Step 3: Apply Migrations

Apply the initial schema to your development database:

```bash
wrangler d1 execute l5r-tactics-dev --file migrations/0001_init.sql
```

For production:

```bash
wrangler d1 execute l5r-tactics-prod --file migrations/0001_init.sql
```

## Using the Database in Workers

The database is bound to your worker as `DB` in the `Env` interface. Example:

```typescript
interface Env {
  DB: D1Database
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Query the database
    const result = await env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first()
    
    return new Response(JSON.stringify(result))
  }
}
```

## Database Utility Functions

See `src/db.ts` for helper functions including:
- `createUser(db, id, email, username)`
- `getUserById(db, id)`
- `getUserByEmail(db, email)`
- `createCampaign(db, id, name, gmId, description)`
- `getCampaignById(db, id)`
- `getCampaignsByGM(db, gmId)`
- `createCharacter(db, ...)`
- `getCharactersByPlayer(db, playerId)`
- `getCharactersByCampaign(db, campaignId)`

## Local Development

For local testing with `wrangler dev`, D1 provides a local SQLite instance automatically.

```bash
wrangler d1 execute l5r-tactics-dev --local --file migrations/0001_init.sql
wrangler dev --local
```

## Viewing Database Contents

View data in your database:

```bash
# Development
wrangler d1 execute l5r-tactics-dev --command "SELECT * FROM users"

# Production
wrangler d1 execute l5r-tactics-prod --command "SELECT * FROM users"
```

## Creating New Migrations

When you need to modify the schema:

1. Create a new file in `migrations/`:
   ```
   migrations/0002_add_column.sql
   ```

2. Write your SQL changes

3. Apply the migration:
   ```bash
   wrangler d1 execute l5r-tactics-dev --file migrations/0002_add_column.sql
   ```

## Backup and Recovery

D1 automatically backs up data. For additional backups:

```bash
# Export data
wrangler d1 execute l5r-tactics-prod --command "VACUUM INTO 'backup.db'"

# Restore from backup
# Use the Cloudflare dashboard
```

## Troubleshooting

### Database Not Found
- Make sure you created the database with `wrangler d1 create`
- Check that the database_id in `wrangler.toml` matches

### Migration Errors
- Ensure the SQL is valid
- Check that tables don't already exist (migrations should be idempotent with `IF NOT EXISTS`)

### Connection Issues
- Verify your Cloudflare account and Workers are enabled
- Run `wrangler whoami` to check authentication

## Next Steps

1. Create the databases (dev and prod)
2. Apply migrations
3. See `server/README.md` for how to use the database in API endpoints
