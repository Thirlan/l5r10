/**
 * Authentication Configuration
 * 
 * OAuth2 provider configuration for L5R Tactical RPG
 * Supports: Email, Google, Discord
 */

export interface AuthConfig {
  providers: {
    email: {
      enabled: boolean
    }
    google: {
      enabled: boolean
      clientId: string
      clientSecret: string
      redirectUri: string
    }
    discord: {
      enabled: boolean
      clientId: string
      clientSecret: string
      redirectUri: string
    }
  }
  jwt: {
    secret: string
    expiresIn: number // in seconds
  }
  session: {
    expiresIn: number // in seconds (30 days default)
  }
}

/**
 * Parse auth config from environment variables
 */
export function getAuthConfig(env: Record<string, any>): AuthConfig {
  return {
    providers: {
      email: {
        enabled: env.AUTH_EMAIL_ENABLED === 'true',
      },
      google: {
        enabled: env.AUTH_GOOGLE_ENABLED === 'true',
        clientId: env.AUTH_GOOGLE_CLIENT_ID || '',
        clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET || '',
        redirectUri: env.AUTH_GOOGLE_REDIRECT_URI || 'http://localhost:8787/auth/callback/google',
      },
      discord: {
        enabled: env.AUTH_DISCORD_ENABLED === 'true',
        clientId: env.AUTH_DISCORD_CLIENT_ID || '',
        clientSecret: env.AUTH_DISCORD_CLIENT_SECRET || '',
        redirectUri: env.AUTH_DISCORD_REDIRECT_URI || 'http://localhost:8787/auth/callback/discord',
      },
    },
    jwt: {
      secret: env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expiresIn: parseInt(env.JWT_EXPIRES_IN || '86400', 10), // 24 hours default
    },
    session: {
      expiresIn: parseInt(env.SESSION_EXPIRES_IN || '2592000', 10), // 30 days default
    },
  }
}

/**
 * Validate that auth config is properly set up
 */
export function validateAuthConfig(config: AuthConfig): boolean {
  let valid = true

  if (config.providers.google.enabled && !config.providers.google.clientId) {
    console.warn('Google OAuth enabled but clientId not configured')
    valid = false
  }

  if (config.providers.discord.enabled && !config.providers.discord.clientId) {
    console.warn('Discord OAuth enabled but clientId not configured')
    valid = false
  }

  if (!config.jwt.secret || config.jwt.secret === 'dev-secret-key-change-in-production') {
    // In production, JWT secret should be configured
    console.warn('Using default JWT secret - configure JWT_SECRET environment variable for production')
  }

  return valid
}
