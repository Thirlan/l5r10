/**
 * Login Page Component
 * 
 * OAuth login page with email/password form support
 */

import React, { useState } from 'react'

interface LoginPageProps {
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
}

type LoginTab = 'oauth' | 'email'

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [activeTab, setActiveTab] = useState<LoginTab>('oauth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validate input
      if (!email || !password) {
        setError('Please enter email and password')
        setLoading(false)
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        setLoading(false)
        return
      }

      // Create user account
      const response = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `user_${Date.now()}`,
          email,
          username: email.split('@')[0],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setMessage('Account created successfully! You can now log in.')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate input
      if (!email || !password) {
        setError('Please enter email and password')
        setLoading(false)
        return
      }

      // TODO: Implement email/password login with backend
      setError('Email login coming soon. Please use OAuth providers.')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            L5R Tactical RPG
          </h1>
          <p className="text-gray-600">
            Legend of the Five Rings Tactical Battles
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('oauth')
              setError('')
              setMessage('')
            }}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'oauth'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            OAuth
          </button>
          <button
            onClick={() => {
              setActiveTab('email')
              setError('')
              setMessage('')
            }}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* OAuth Tab */}
        {activeTab === 'oauth' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sign in with OAuth
            </h2>

            {/* Google Login Button */}
            <a
              href={`${apiBase}/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-gray-900"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>Google</span>
            </a>

            {/* Discord Login Button */}
            <a
              href={`${apiBase}/auth/discord`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2524-1.8447-.2768-3.6829-.2768-5.4753 0-.1636-.3876-.3957-.8771-.6121-1.2524a.077.077 0 00-.0785-.037 19.7873 19.7873 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C1.6671 9.6864.3144 14.8756 1.7926 19.8458a.082.082 0 00.0313.0553c1.5033 1.1289 2.9657 1.8139 4.400 2.291.042.0136.083-.0110.1046-.0473.4329-.5921.8185-1.2166 1.1512-1.8694.0305-.0547-.0023-.1157-.0648-.1285a13.0007 13.0007 0 01-1.9185-.9023.0771.0771 0 01-.0076-.1277c.1294-.0977.2587-.1952.3923-.2852a.0771.0771 0 01.0838-.0033c4.0211 1.8711 8.3584 1.8711 12.3428 0a.077.077 0 01.0823.0043c.1336.9.2655 1.8073.3922 2.7160a.0771.0771 0 01-.0076.1288 12.9626 12.9626 0 01-1.9608.9141.0771.0771 0 01-.0647.1285c.329.5968.7133 1.2213 1.1501 1.8694.0203.0364.0606.049.1046.0473 1.4327-.477 2.8951-1.1646 4.3977-2.291a.08.08 0 00.0313-.0553c1.5838-5.236 0.2313-9.7521-1.0039-13.4432a.0693.0693 0 00-.0321-.0276zM8.02 15.3312c-1.1825 0-2.1569-.9626-2.1569-2.1313 0-1.1686.9555-2.1313 2.157-2.1313 1.2016 0 2.1645.9626 2.1557 2.1313 0 1.1687-.9555 2.1313-2.1558 2.1313zm7.9748 0c-1.1825 0-2.1569-.9626-2.1569-2.1313 0-1.1686.9554-2.1313 2.1569-2.1313 1.2026 0 2.1655.9626 2.1567 2.1313 0 1.1687-.954 2.1313-2.1567 2.1313Z" />
              </svg>
              <span>Discord</span>
            </a>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <form className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create Account or Sign In
            </h2>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="At least 8 characters"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleEmailSignup}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full px-4 py-2 border-2 border-gray-300 text-gray-900 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Password-based authentication is currently in development.
            </p>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600 font-mono">
            <p>API: {apiBase}</p>
            <p>NODE_ENV: {import.meta.env.MODE}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
