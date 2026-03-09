/**
 * OAuth Callback Page
 * 
 * Handles OAuth provider redirects and session establishment
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, setError } = useAuth()
  const [error, setErrorMessage] = useState('')

  useEffect(() => {
    processCallback()
  }, [location])

  const processCallback = async () => {
    try {
      // Extract auth data from cookie or session
      // The backend will have set the session cookie with the OAuth callback

      // For OAuth flow:
      // 1. User clicks OAuth button
      // 2. Redirected to /auth/google or /auth/discord
      // 3. OAuth provider redirects back to /auth/callback/google or /auth/callback/discord
      // 4. Backend processes OAuth and sets Set-Cookie header with session token
      // 5. Browser redirects to /oauth-callback
      // 6. This page reads the session token from localStorage (set by the OAuth endpoint)
      // 7. Authenticates user and redirects to dashboard

      // Check if we have a token from the OAuth provider
      const token = localStorage.getItem('authToken')
      const userStr = localStorage.getItem('authUser')

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          login(user, token)
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 500)
        } catch (error) {
          setErrorMessage('Failed to parse user data')
          console.error(error)
        }
      } else {
        // No token found - redirect to login
        setErrorMessage('No authentication token received. Please try again.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      setErrorMessage('An error occurred during authentication')
      setError(String(error))
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <p className="text-red-600 mb-6">{error}</p>
          <p className="text-gray-600 text-sm mb-6">
            Redirecting to login...
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Completing Sign In
        </h1>
        <p className="text-gray-600">
          Please wait while we authenticate you...
        </p>
      </div>
    </div>
  )
}

export default OAuthCallback
