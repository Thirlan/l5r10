/**
 * Shared types for L5R Tactical RPG
 */

// Player and Character Types
export interface Character {
  id: string
  name: string
  playerId: string
  clanId: string
  schoolId: string
  rings: Rings
  skills: Record<string, number>
  advantages: string[]
  disadvantages: string[]
  equipment: Equipment[]
  wounds: Wounds
  honor: number
}

export interface Rings {
  air: number
  earth: number
  fire: number
  water: number
  void: number
}

export interface Wounds {
  healthy: number
  nicked: number
  grazed: number
  hurt: number
  injured: number
  crippled: number
  down: number
  out: number
}

export interface Equipment {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory'
  properties: Record<string, unknown>
}

// Battle Types
export interface BattleState {
  id: string
  mapId: string
  characterPositions: Record<string, HexCoordinate>
  initiative: string[]
  currentTurn: number
  currentPhase: 'movement' | 'action' | 'resolution'
  combatLog: CombatLogEntry[]
  status: 'active' | 'paused' | 'completed'
}

export interface HexCoordinate {
  q: number
  r: number
  s: number
}

export interface CombatLogEntry {
  timestamp: number
  characterId: string
  action: string
  details: Record<string, unknown>
}

// Map Types
export interface Map {
  id: string
  name: string
  width: number
  height: number
  tiles: Tile[]
}

export interface Tile {
  id: string
  coordinate: HexCoordinate
  terrain: TerrainType
  properties: Record<string, unknown>
}

export type TerrainType = 'grass' | 'forest' | 'water' | 'mountain' | 'sand'

// Game Action Types
export type GameAction = 
  | MoveAction
  | AttackAction
  | EndTurnAction

export interface MoveAction {
  type: 'move'
  characterId: string
  destination: HexCoordinate
}

export interface AttackAction {
  type: 'attack'
  characterId: string
  targetId: string
}

export interface EndTurnAction {
  type: 'endTurn'
  characterId: string
}
