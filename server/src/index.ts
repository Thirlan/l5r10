/**
 * L5R Tactical RPG - API Server
 * Cloudflare Workers
 */

import {
  createUserHandler,
  getUserHandler,
  getUserByEmailHandler,
} from './routes/users'
import {
  createCampaignHandler,
  getCampaignHandler,
  getGMCampaignsHandler,
} from './routes/campaigns'
import {
  createCharacterHandler,
  getPlayerCharactersHandler,
  getCampaignCharactersHandler,
} from './routes/characters'
import {
  loginWithGoogleHandler,
  loginWithDiscordHandler,
  googleCallbackHandler,
  discordCallbackHandler,
  logoutHandler,
  currentUserHandler,
} from './routes/auth'

export interface Env {
  DB: D1Database
  // Authentication environment variables
  AUTH_EMAIL_ENABLED?: string
  AUTH_GOOGLE_ENABLED?: string
  AUTH_GOOGLE_CLIENT_ID?: string
  AUTH_GOOGLE_CLIENT_SECRET?: string
  AUTH_GOOGLE_REDIRECT_URI?: string
  AUTH_DISCORD_ENABLED?: string
  AUTH_DISCORD_CLIENT_ID?: string
  AUTH_DISCORD_CLIENT_SECRET?: string
  AUTH_DISCORD_REDIRECT_URI?: string
  JWT_SECRET?: string
  JWT_EXPIRES_IN?: string
  SESSION_EXPIRES_IN?: string
  // Future bindings:
  // - STORAGE: R2Bucket
  // - RATE_LIMITER: RateLimiterNamespace
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Routes
    if (url.pathname === '/api/ping') {
      return handlePing(request, env)
    }

    if (url.pathname === '/api/health') {
      return handleHealth(request, env)
    }

    // User routes
    if (url.pathname === '/api/users' && method === 'POST') {
      return createUserHandler(request, env)
    }

    const userIdMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/)
    if (userIdMatch && method === 'GET') {
      return getUserHandler(request, env, userIdMatch[1])
    }

    const userEmailMatch = url.pathname.match(/^\/api\/users\/email\/(.+)$/)
    if (userEmailMatch && method === 'GET') {
      return getUserByEmailHandler(request, env, userEmailMatch[1])
    }

    // Campaign routes
    if (url.pathname === '/api/campaigns' && method === 'POST') {
      return createCampaignHandler(request, env)
    }

    const campaignIdMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)$/)
    if (campaignIdMatch && method === 'GET') {
      return getCampaignHandler(request, env, campaignIdMatch[1])
    }

    const gmCampaignsMatch = url.pathname.match(/^\/api\/campaigns\/gm\/([^/]+)$/)
    if (gmCampaignsMatch && method === 'GET') {
      return getGMCampaignsHandler(request, env, gmCampaignsMatch[1])
    }

    // Character routes
    if (url.pathname === '/api/characters' && method === 'POST') {
      return createCharacterHandler(request, env)
    }

    const playerCharactersMatch = url.pathname.match(
      /^\/api\/characters\/player\/([^/]+)$/,
    )
    if (playerCharactersMatch && method === 'GET') {
      return getPlayerCharactersHandler(request, env, playerCharactersMatch[1])
    }

    const campaignCharactersMatch = url.pathname.match(
      /^\/api\/characters\/campaign\/([^/]+)$/,
    )
    if (campaignCharactersMatch && method === 'GET') {
      return getCampaignCharactersHandler(
        request,
        env,
        campaignCharactersMatch[1],
      )
    }

    // Authentication routes
    if (url.pathname === '/auth/google' && method === 'GET') {
      return loginWithGoogleHandler(request, env)
    }

    if (url.pathname === '/auth/discord' && method === 'GET') {
      return loginWithDiscordHandler(request, env)
    }

    if (url.pathname === '/auth/callback/google' && method === 'GET') {
      return googleCallbackHandler(request, env)
    }

    if (url.pathname === '/auth/callback/discord' && method === 'GET') {
      return discordCallbackHandler(request, env)
    }

    if (url.pathname === '/auth/logout' && method === 'GET') {
      return logoutHandler(request)
    }

    if (url.pathname === '/auth/me' && method === 'GET') {
      return currentUserHandler(request, env)
    }

    // 404 Not Found
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        path: url.pathname,
        method: method,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  },
}

/**
 * Ping endpoint - used to test basic connectivity
 */
async function handlePing(request: Request, env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'L5R Tactical RPG API is running',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

/**
 * Health check endpoint
 */
async function handleHealth(request: Request, env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({
      healthy: true,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
