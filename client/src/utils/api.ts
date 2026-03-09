/**
 * API Client utilities for communicating with the L5R Tactics API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export interface PingResponse {
  status: string
  timestamp: string
  message: string
}

export interface HealthResponse {
  healthy: boolean
  version: string
  timestamp: string
}

/**
 * Fetch the ping endpoint to verify API is running
 */
export async function fetchPing(): Promise<PingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ping`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch the health endpoint for detailed status
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
