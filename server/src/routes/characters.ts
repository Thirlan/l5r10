/**
 * Character routes for managing player characters
 */

import {
  createCharacter,
  getCharactersByPlayer,
  getCharactersByCampaign,
} from '../db'

interface Env {
  DB: D1Database
}

/**
 * POST /api/characters - Create a new character
 */
export async function createCharacterHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json()) as any
    const {
      id,
      name,
      playerId,
      campaignId,
      clanId,
      schoolId,
      attributes,
      skills,
    } = body

    // Validate input
    if (
      !id ||
      !name ||
      !playerId ||
      !campaignId ||
      !clanId ||
      !schoolId ||
      !attributes ||
      !skills
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: id, name, playerId, campaignId, clanId, schoolId, attributes, skills',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    // Validate attributes and skills are objects
    if (typeof attributes !== 'object' || typeof skills !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'attributes and skills must be objects',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const result = await createCharacter(
      env.DB,
      id,
      name,
      playerId,
      campaignId,
      clanId,
      schoolId,
      attributes,
      skills,
    )

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create character',
          details: result.error,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Character created successfully',
        characterId: id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to create character',
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

/**
 * GET /api/characters/player/:playerId - Get characters for a player
 */
export async function getPlayerCharactersHandler(
  request: Request,
  env: Env,
  playerId: string,
): Promise<Response> {
  try {
    if (!playerId) {
      return new Response(
        JSON.stringify({ error: 'Player ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const characters = await getCharactersByPlayer(env.DB, playerId)

    return new Response(
      JSON.stringify({ characters, count: characters.length }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch characters',
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

/**
 * GET /api/characters/campaign/:campaignId - Get characters in a campaign
 */
export async function getCampaignCharactersHandler(
  request: Request,
  env: Env,
  campaignId: string,
): Promise<Response> {
  try {
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const characters = await getCharactersByCampaign(env.DB, campaignId)

    return new Response(
      JSON.stringify({ characters, count: characters.length }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch characters',
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}
