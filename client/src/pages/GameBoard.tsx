/**
 * Game Board Page
 * 
 * Main game play area with PixiJS rendering
 */

import React, { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import PixiRenderer from '../components/PixiRenderer'
import * as PIXI from 'pixi.js'

interface GameBoardProps {
  campaignId?: string
}

export const GameBoard: React.FC<GameBoardProps> = ({ campaignId }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const appRef = useRef<PIXI.Application | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [stats, setStats] = useState({
    fps: 0,
    entities: 0,
  })

  const handlePixiReady = (app: PIXI.Application) => {
    appRef.current = app

    // Create main container
    const mainContainer = new PIXI.Container()
    app.stage.addChild(mainContainer)

    // Create grid background
    const graphics = new PIXI.Graphics()
    graphics.lineStyle(1, 0x333333)
    
    const gridSize = 50
    const canvas = app.canvas as HTMLCanvasElement
    for (let x = 0; x < canvas.width; x += gridSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, canvas.height)
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(canvas.width, y)
    }
    
    mainContainer.addChild(graphics)

    // Add center point indicator
    const center = new PIXI.Graphics()
    center.lineStyle(2, 0x00ff00)
    center.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2)
    mainContainer.addChild(center)

    // Add FPS ticker
    app.ticker.add(() => {
      setStats({
        fps: Math.round(app.ticker.FPS),
        entities: mainContainer.children.length,
      })
    })

    setIsInitialized(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header/Top Bar */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-white">
            {campaignId ? `Campaign ${campaignId}` : 'Game Board'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono">
            FPS: {stats.fps} | Entities: {stats.entities}
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Game Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-400">Initializing game board...</p>
            </div>
          </div>
        )}

        <PixiRenderer
          width={window.innerWidth}
          height={window.innerHeight - 100}
          backgroundColor={0x0a0a0a}
          onReady={handlePixiReady}
        />
      </div>

      {/* Bottom Status Bar */}
      <footer className="bg-gray-900 border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div>
            Zoom: 100% | Pan: (0, 0) | Mode: View
          </div>
          <div>
            Hot keys: [Z] Zoom | [P] Pan | [S] Select | [D] Deselect
          </div>
        </div>
      </footer>
    </div>
  )
}

export default GameBoard
