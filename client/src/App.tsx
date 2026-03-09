import { usePing } from './utils/hooks'

export function App() {
  const { data: pingData, loading, error } = usePing()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">L5R Tactical RPG</h1>
        <p className="text-lg text-gray-400 mb-8">
          Turn-based hex-grid tactical combat
        </p>

        {/* API Status Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            Server Status
          </h2>

          {loading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-transparent border-t-blue-500" />
              <p className="text-gray-400">Connecting to API...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 rounded p-4">
              <p className="text-red-200 text-sm font-semibold">
                ❌ Connection Error
              </p>
              <p className="text-red-100 text-xs mt-1">{error.message}</p>
            </div>
          )}

          {pingData && (
            <div className="bg-green-900 border border-green-700 rounded p-4">
              <p className="text-green-200 text-sm font-semibold">
                ✓ {pingData.status.toUpperCase()}
              </p>
              <p className="text-green-100 text-xs mt-2">{pingData.message}</p>
              <p className="text-green-100 text-xs mt-1 opacity-75">
                {new Date(pingData.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
