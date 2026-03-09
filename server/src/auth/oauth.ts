/**
 * Authentication Utilities
 * 
 * Helper functions for OAuth2 flows
 */

export interface TokenPayload {
  userId: string
  email: string
  username: string
  iat: number
  exp: number
}

/**
 * Generate OAuth2 authorization URL for Google
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Generate OAuth2 authorization URL for Discord
 */
export function getDiscordAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state: state,
  })

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange OAuth2 code for access token from Google
 */
export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ access_token: string; id_token: string }> {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Exchange OAuth2 code for access token from Discord
 */
export async function exchangeDiscordCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string }> {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(idToken: string): Promise<any> {
  // For simplicity, decode JWT without verification
  // In production, verify the signature using Google's public keys
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }

  const decoded = JSON.parse(atob(parts[1]))
  return decoded
}

/**
 * Get user info from Discord using access token
 */
export async function getDiscordUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get Discord user info: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate secure random state for OAuth2 CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate secure random code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generate code challenge from code verifier (PKCE)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
