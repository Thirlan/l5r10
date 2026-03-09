/**
 * PixiJS Game Renderer
 * 
 * Manages the game canvas and PixiJS rendering
 */

import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

interface PixiRendererProps {
  width?: number
  height?: number
  backgroundColor?: number
  onReady?: (app: PIXI.Application) => void
}

export const PixiRenderer: React.FC<PixiRendererProps> = ({
  width = 1280,
  height = 720,
  backgroundColor = 0x1a1a1a,
  onReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!containerRef.current || appRef.current) {
      return
    }

    // Create PixiJS application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    })

    // Add canvas to DOM
    containerRef.current.appendChild(app.canvas)
    appRef.current = app

    // Call onReady callback
    if (onReady) {
      onReady(app)
    }

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && app) {
        const rect = containerRef.current.getBoundingClientRect()
        app.renderer.resize(rect.width, rect.height)
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (appRef.current && containerRef.current) {
        containerRef.current.removeChild(app.canvas)
        app.destroy(true)
        appRef.current = null
      }
    }
  }, [width, height, backgroundColor, onReady])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-900"
      style={{ position: 'relative' }}
    />
  )
}

export default PixiRenderer
