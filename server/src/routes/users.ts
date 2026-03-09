/**
 * User routes for managing player and GM accounts
 */

import { createUser, getUserById, getUserByEmail } from '../db'

interface Env {
  DB: D1Database
}

/**
 * POST /api/users - Create a new user
 */
export async function createUserHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json()) as any
    const { id, email, username } = body

    // Validate input
    if (!id || !email || !username) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: id, email, username',
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

    const result = await createUser(env.DB, id, email, username)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create user',
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
        message: 'User created successfully',
        userId: id,
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
        error: 'Failed to create user',
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
 * GET /api/users/:id - Get user by ID
 */
export async function getUserHandler(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  try {
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const user = await getUserById(env.DB, userId)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch user',
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
 * GET /api/users/email/:email - Get user by email
 */
export async function getUserByEmailHandler(
  request: Request,
  env: Env,
  email: string,
): Promise<Response> {
  try {
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const user = await getUserByEmail(env.DB, email)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch user',
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
