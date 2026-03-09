/**
 * Authentication Routes
 * 
 * OAuth2 login flow handlers for Google and Discord
 */

import { Env } from '../index'
import { getAuthConfig } from '../auth/config'
import {
  getGoogleAuthUrl,
  getDiscordAuthUrl,
  generateState,
  exchangeGoogleCode,
  getGoogleUserInfo,
  exchangeDiscordCode,
  getDiscordUserInfo,
} from '../auth/oauth'
import { createToken, JWTPayload, createSetCookieHeader, getTokenExpiration } from '../auth/jwt'
import { 
  createUser, 
  getUserByEmail, 
  createOAuthProvider,
  getOAuthProviderByProviderId,
  updateOAuthProviderLastLogin,
} from '../db'

/**
 * GET /auth/google
 * Redirect to Google OAuth login
 */
export async function loginWithGoogleHandler(request: Request, env: Env): Promise<Response> {
  const config = getAuthConfig(env)

  if (!config.providers.google.enabled) {
    return new Response(JSON.stringify({ error: 'Google OAuth not enabled' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const state = generateState()

  // Store state in KV for verification later
  // For now, we'll just use it in the URL
  const authUrl = getGoogleAuthUrl(
    config.providers.google.clientId,
    config.providers.google.redirectUri,
    state,
  )

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
    },
  })
}

/**
 * GET /auth/discord
 * Redirect to Discord OAuth login
 */
export async function loginWithDiscordHandler(request: Request, env: Env): Promise<Response> {
  const config = getAuthConfig(env)

  if (!config.providers.discord.enabled) {
    return new Response(JSON.stringify({ error: 'Discord OAuth not enabled' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const state = generateState()
  const authUrl = getDiscordAuthUrl(
    config.providers.discord.clientId,
    config.providers.discord.redirectUri,
    state,
  )

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
    },
  })
}

/**
 * GET /auth/callback/google
 * Handle Google OAuth callback
 */
export async function googleCallbackHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const config = getAuthConfig(env)
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code) {
      return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Exchange code for token
    const tokenData = await exchangeGoogleCode(
      code,
      config.providers.google.clientId,
      config.providers.google.clientSecret,
      config.providers.google.redirectUri,
    )

    // Get user info from token
    const userInfo = await getGoogleUserInfo(tokenData.id_token)

    // Find or create user
    let user = await getUserByEmail(env.DB, userInfo.email)
    if (!user) {
      const userId = `user_${Date.now()}`
      await createUser(env.DB, userId, userInfo.email, userInfo.name || userInfo.email)
      user = { id: userId, email: userInfo.email, username: userInfo.name || userInfo.email }
    }

    // Create or link OAuth provider
    const existingOAuth = await getOAuthProviderByProviderId(env.DB, 'google', userInfo.sub)
    if (!existingOAuth) {
      const oauthId = `oauth_google_${Date.now()}`
      await createOAuthProvider(
        env.DB,
        oauthId,
        user.id,
        'google',
        userInfo.sub,
        userInfo.email,
        userInfo.name,
        userInfo.picture,
      )
    } else {
      // Update last login
      await updateOAuthProviderLastLogin(env.DB, existingOAuth.id)
    }

    // Create session token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username || user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: getTokenExpiration(config.jwt.expiresIn),
    }

    const token = createToken(payload, config.jwt.secret)
    const setCookieHeader = createSetCookieHeader(token, config.session.expiresIn)

    // Redirect to dashboard with session
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': setCookieHeader,
      },
    })
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication failed', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

/**
 * GET /auth/callback/discord
 * Handle Discord OAuth callback
 */
export async function discordCallbackHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const config = getAuthConfig(env)
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Exchange code for token
    const tokenData = await exchangeDiscordCode(
      code,
      config.providers.discord.clientId,
      config.providers.discord.clientSecret,
      config.providers.discord.redirectUri,
    )

    // Get user info
    const userInfo = await getDiscordUserInfo(tokenData.access_token)
    const email = userInfo.email || `discord_${userInfo.id}@discord.local`

    // Find or create user
    let user = await getUserByEmail(env.DB, email)
    if (!user) {
      const userId = `user_${Date.now()}`
      await createUser(env.DB, userId, email, userInfo.username)
      user = { id: userId, email, username: userInfo.username }
    }

    // Create or link OAuth provider
    const existingOAuth = await getOAuthProviderByProviderId(env.DB, 'discord', userInfo.id)
    if (!existingOAuth) {
      const oauthId = `oauth_discord_${Date.now()}`
      await createOAuthProvider(
        env.DB,
        oauthId,
        user.id,
        'discord',
        userInfo.id,
        userInfo.email,
        userInfo.username,
        userInfo.avatar ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png` : undefined,
      )
    } else {
      // Update last login
      await updateOAuthProviderLastLogin(env.DB, existingOAuth.id)
    }

    // Create session token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username || user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: getTokenExpiration(config.jwt.expiresIn),
    }

    const token = createToken(payload, config.jwt.secret)
    const setCookieHeader = createSetCookieHeader(token, config.session.expiresIn)

    // Redirect to dashboard with session
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': setCookieHeader,
      },
    })
  } catch (error) {
    console.error('Discord OAuth callback error:', error)
    return new Response(
      JSON.stringify({ error: 'Authentication failed', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

/**
 * GET /auth/logout
 * Clear session and redirect to home
 */
export async function logoutHandler(request: Request): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;',
    },
  })
}

/**
 * GET /auth/me
 * Get current user info from token
 */
export async function currentUserHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization')
    const cookieHeader = request.headers.get('Cookie')

    if (!authHeader && !cookieHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Implement token verification with proper JWT library
    return new Response(JSON.stringify({ message: 'User authenticated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get current user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
