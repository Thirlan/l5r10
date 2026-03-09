/**
 * Campaign routes for managing game campaigns
 */

import { createCampaign, getCampaignById, getCampaignsByGM } from '../db'

interface Env {
  DB: D1Database
}

/**
 * POST /api/campaigns - Create a new campaign
 */
export async function createCampaignHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json()) as any
    const { id, name, gmId, description } = body

    // Validate input
    if (!id || !name || !gmId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: id, name, gmId',
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

    const result = await createCampaign(env.DB, id, name, gmId, description)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create campaign',
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
        message: 'Campaign created successfully',
        campaignId: id,
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
        error: 'Failed to create campaign',
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
 * GET /api/campaigns/:id - Get campaign by ID
 */
export async function getCampaignHandler(
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

    const campaign = await getCampaignById(env.DB, campaignId)

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return new Response(JSON.stringify(campaign), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch campaign',
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
 * GET /api/campaigns/gm/:gmId - Get campaigns for a GM
 */
export async function getGMCampaignsHandler(
  request: Request,
  env: Env,
  gmId: string,
): Promise<Response> {
  try {
    if (!gmId) {
      return new Response(
        JSON.stringify({ error: 'GM ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const campaigns = await getCampaignsByGM(env.DB, gmId)

    return new Response(JSON.stringify({ campaigns, count: campaigns.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch campaigns',
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
