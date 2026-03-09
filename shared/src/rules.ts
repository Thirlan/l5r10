/**
 * L5R Game Rules and Utilities
 */

import { Character, Rings, HexCoordinate } from './types'

/**
 * Calculate the school rank bonus (1st rank = +1k1, 2nd rank = +2k2, etc.)
 * @param schoolRank The character's school rank (1-5)
 * @returns Object with rolls and keep bonuses
 */
export function getSchoolRankBonus(schoolRank: number): {
  rollBonus: number
  keepBonus: number
} {
  if (schoolRank < 1 || schoolRank > 5) {
    throw new Error('School rank must be between 1 and 5')
  }
  
  return {
    rollBonus: schoolRank,
    keepBonus: schoolRank,
  }
}

/**
 * Calculate skill rank bonuses
 * @param skillRank The skill rank (0-5)
 * @returns Roll bonus
 */
export function getSkillBonus(skillRank: number): number {
  if (skillRank < 0 || skillRank > 5) {
    throw new Error('Skill rank must be between 0 and 5')
  }
  return skillRank
}

/**
 * Calculate ring bonus (ring rank = bonus)
 * @param ringRank The ring rank (1-5)
 * @returns Ring bonus
 */
export function getRingBonus(ringRank: number): number {
  if (ringRank < 1 || ringRank > 5) {
    throw new Error('Ring rank must be between 1 and 5')
  }
  return ringRank
}

/**
 * Calculate total skill emphasis (roll and keep bonus)
 * @param character The character
 * @param skillName The skill name
 * @param relevantRing The relevant ring for this skill
 * @returns Object with rollBonus and keepBonus
 */
export function calculateSkillEmphasis(
  character: Character,
  skillName: string,
  relevantRing: keyof Rings
): {
  rollBonus: number
  keepBonus: number
} {
  const skillRank = character.skills[skillName] ?? 0
  const ringRank = character.rings[relevantRing]
  
  return {
    rollBonus: ringRank + skillRank,
    keepBonus: ringRank,
  }
}

/**
 * Calculate hexagonal distance between two coordinates
 * @param from Source hex coordinate
 * @param to Destination hex coordinate
 * @returns Distance in hexes
 */
export function hexDistance(from: HexCoordinate, to: HexCoordinate): number {
  return (Math.abs(from.q - to.q) + Math.abs(from.r - to.r) + Math.abs(from.s - to.s)) / 2
}

/**
 * Get neighboring hexes from a coordinate
 * @param coordinate Hex coordinate
 * @returns Array of 6 neighboring coordinates
 */
export function getHexNeighbors(coordinate: HexCoordinate): HexCoordinate[] {
  const directions = [
    { q: 1, r: 0, s: -1 },
    { q: 1, r: -1, s: 0 },
    { q: 0, r: -1, s: 1 },
    { q: -1, r: 0, s: 1 },
    { q: -1, r: 1, s: 0 },
    { q: 0, r: 1, s: -1 },
  ]
  
  return directions.map(dir => ({
    q: coordinate.q + dir.q,
    r: coordinate.r + dir.r,
    s: coordinate.s + dir.s,
  }))
}

/**
 * Check if two hex coordinates are adjacent
 * @param coord1 First hex coordinate
 * @param coord2 Second hex coordinate
 * @returns True if adjacent
 */
export function areHexesAdjacent(coord1: HexCoordinate, coord2: HexCoordinate): boolean {
  return hexDistance(coord1, coord2) === 1
}

/**
 * Get movement range in hexes based on character action
 * @param character The character
 * @returns Maximum hex movement distance
 */
export function getMovementRange(character: Character): number {
  // Base movement for now, can be expanded with traits
  return 6
}

/**
 * Calculate armor reduction from armor TN
 * @param armorTN Armor's TN
 * @returns Damage reduction
 */
export function getArmorReduction(armorTN: number): number {
  // In L5R, armor reduces damage based on how much the attack roll exceeds its TN
  // This is simplified - actual calculation depends on attack outcome
  return Math.max(0, armorTN - 10)
}

/**
 * Check if a value exceeds TN (Target Number)
 * @param value Roll result
 * @param tn Target number
 * @returns True if value >= tn
 */
export function exceeds(value: number, tn: number): boolean {
  return value >= tn
}
