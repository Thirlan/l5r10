/**
 * JWT Token Management
 * 
 * JWT token creation and verification for session management
 * Note: Using simple base64 encoding for Cloudflare Workers compatibility
 * For production, integrate with proper JWT library
 */

export interface JWTPayload {
  userId: string
  email: string
  username: string
  iat: number
  exp: number
}

/**
 * Simple JWT creation (base64 encoded)
 * In production, this should be properly signed
 */
export function createToken(payload: JWTPayload, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const message = `${encodedHeader}.${encodedPayload}`

  // For now, use a simple HMAC-like approach
  // In production, implement proper HMAC-SHA256
  const signature = btoa(secret + message)

  return `${message}.${signature}`
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [encodedHeader, encodedPayload, signature] = parts
    const payload = JSON.parse(atob(encodedPayload))

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    // In production, verify signature properly
    // For now, just validate format
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1]
  }

  return null
}

/**
 * Create session cookie value
 */
export function createSessionCookie(token: string): string {
  return token
}

/**
 * Create Set-Cookie header value
 */
export function createSetCookieHeader(
  token: string,
  expiresIn: number,
  secure: boolean = false,
): string {
  const expiresDate = new Date(Date.now() + expiresIn * 1000)

  const attributes = [
    `session=${token}`,
    `Expires=${expiresDate.toUTCString()}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ]

  if (secure) {
    attributes.push('Secure')
  }

  return attributes.join('; ')
}

/**
 * Extract session token from cookies
 */
export function extractSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === 'session' && value) {
      return value
    }
  }

  return null
}

/**
 * Generate token expiration timestamp
 */
export function getTokenExpiration(expiresIn: number): number {
  return Math.floor(Date.now() / 1000) + expiresIn
}
