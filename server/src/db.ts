/**
 * Database utility functions for D1
 */

export interface QueryOptions {
  limit?: number
  offset?: number
}

/**
 * Creates a new user in the database
 */
export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  username: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare('INSERT INTO users (id, email, username) VALUES (?, ?, ?)')
      .bind(id, email, username)
      .run()

    return { success: !!result.success }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(
  db: D1Database,
  id: string,
): Promise<{ id: string; email: string; username: string } | null> {
  try {
    const result = await db
      .prepare('SELECT id, email, username FROM users WHERE id = ?')
      .bind(id)
      .first()

    return result as any
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<{ id: string; email: string; username: string } | null> {
  try {
    const result = await db
      .prepare('SELECT id, email, username FROM users WHERE email = ?')
      .bind(email)
      .first()

    return result as any
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  db: D1Database,
  id: string,
  name: string,
  gmId: string,
  description?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        'INSERT INTO campaigns (id, name, gm_id, description) VALUES (?, ?, ?, ?)',
      )
      .bind(id, name, gmId, description || null)
      .run()

    return { success: !!result.success }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get a campaign by ID
 */
export async function getCampaignById(db: D1Database, id: string): Promise<any> {
  try {
    const result = await db
      .prepare('SELECT * FROM campaigns WHERE id = ?')
      .bind(id)
      .first()

    return result
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return null
  }
}

/**
 * Get campaigns for a user (as GM)
 */
export async function getCampaignsByGM(
  db: D1Database,
  gmId: string,
): Promise<any[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM campaigns WHERE gm_id = ? ORDER BY created_at DESC')
      .bind(gmId)
      .all()

    return result.results as any[]
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
}

/**
 * Create a new character
 */
export async function createCharacter(
  db: D1Database,
  id: string,
  name: string,
  playerId: string,
  campaignId: string,
  clanId: string,
  schoolId: string,
  attributes: Record<string, number>,
  skills: Record<string, number>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO characters 
        (id, name, player_id, campaign_id, clan_id, school_id, attributes, skills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        name,
        playerId,
        campaignId,
        clanId,
        schoolId,
        JSON.stringify(attributes),
        JSON.stringify(skills),
      )
      .run()

    return { success: !!result.success }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get characters for a player
 */
export async function getCharactersByPlayer(
  db: D1Database,
  playerId: string,
): Promise<any[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM characters WHERE player_id = ? ORDER BY created_at DESC')
      .bind(playerId)
      .all()

    return result.results as any[]
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}

/**
 * Get characters in a campaign
 */
export async function getCharactersByCampaign(
  db: D1Database,
  campaignId: string,
): Promise<any[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM characters WHERE campaign_id = ? ORDER BY created_at DESC')
      .bind(campaignId)
      .all()

    return result.results as any[]
  } catch (error) {
    console.error('Error fetching campaign characters:', error)
    return []
  }
}

/**
 * Link an OAuth provider to a user
 */
export async function createOAuthProvider(
  db: D1Database,
  id: string,
  userId: string,
  provider: 'google' | 'discord',
  providerId: string,
  email?: string,
  displayName?: string,
  avatarUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO oauth_providers 
        (id, user_id, provider, provider_id, email, display_name, avatar_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, userId, provider, providerId, email || null, displayName || null, avatarUrl || null)
      .run()

    return { success: !!result.success }
  } catch (error) {
    console.error('Error creating OAuth provider link:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get OAuth provider by provider ID
 */
export async function getOAuthProviderByProviderId(
  db: D1Database,
  provider: 'google' | 'discord',
  providerId: string,
): Promise<{ id: string; user_id: string; provider: string; provider_id: string; email?: string } | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM oauth_providers WHERE provider = ? AND provider_id = ?')
      .bind(provider, providerId)
      .first()

    return result as any
  } catch (error) {
    console.error('Error fetching OAuth provider:', error)
    return null
  }
}

/**
 * Get all OAuth providers for a user
 */
export async function getUserOAuthProviders(
  db: D1Database,
  userId: string,
): Promise<any[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM oauth_providers WHERE user_id = ?')
      .bind(userId)
      .all()

    return result.results as any[]
  } catch (error) {
    console.error('Error fetching user OAuth providers:', error)
    return []
  }
}

/**
 * Update last login for OAuth provider
 */
export async function updateOAuthProviderLastLogin(
  db: D1Database,
  providerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare('UPDATE oauth_providers SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(providerId)
      .run()

    return { success: !!result.success }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
