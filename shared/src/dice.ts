/**
 * L5R Dice System - Roll and Keep (RaK)
 * 
 * Example: 5k3 means roll 5 dice, keep the highest 3
 */

export interface DiceRollResult {
  rolled: number[]
  kept: number[]
  total: number
  rolls: number // Number of dice rolled
  keep: number // Number of dice kept
}

export interface AttackRoll {
  damageRoll: DiceRollResult
  raises: number
}

/**
 * Roll dice for L5R R&K system
 * @param rolls Number of dice to roll
 * @param keep Number of dice to keep (lowest)
 * @param modifier Optional modifier to add to final result
 * @returns DiceRollResult with rolled, kept, and total
 */
export function rollDice(rolls: number, keep: number, modifier: number = 0): DiceRollResult {
  if (rolls < keep) {
    throw new Error(`Cannot keep ${keep} dice when rolling ${rolls}`)
  }

  // Roll the dice
  const rolled = Array.from({ length: rolls }, () => Math.floor(Math.random() * 6) + 1)
  
  // Sort in descending order and keep the highest
  const sorted = [...rolled].sort((a, b) => b - a)
  const kept = sorted.slice(0, keep)
  
  // Calculate total
  const total = kept.reduce((sum, die) => sum + die, 0) + modifier
  
  return {
    rolled,
    kept,
    total,
    rolls,
    keep,
  }
}

/**
 * Parse a dice notation string like "5k3" or "4k2+2"
 * @param notation Dice notation string (e.g., "5k3", "4k2+1")
 * @returns Object with rolls, keep, and modifier
 */
export function parseDiceNotation(notation: string): {
  rolls: number
  keep: number
  modifier: number
} {
  const match = notation.match(/^(\d+)k(\d+)(?:\+(\d+))?(?:-(\d+))?$/)
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`)
  }

  const rolls = parseInt(match[1], 10)
  const keep = parseInt(match[2], 10)
  const add = match[3] ? parseInt(match[3], 10) : 0
  const subtract = match[4] ? parseInt(match[4], 10) : 0
  const modifier = add - subtract

  return { rolls, keep, modifier }
}

/**
 * Roll dice from notation string
 * @param notation Dice notation (e.g., "5k3")
 * @returns DiceRollResult
 */
export function rollFromNotation(notation: string): DiceRollResult {
  const { rolls, keep, modifier } = parseDiceNotation(notation)
  return rollDice(rolls, keep, modifier)
}

/**
 * Check for exploding dice (6s reroll and add)
 * @param result The initial roll result
 * @returns Updated result with exploding dice applied
 */
export function applyExplodingDice(result: DiceRollResult): DiceRollResult {
  let explodedRolls = [...result.rolled]
  let changed = true
  
  while (changed) {
    changed = false
    const newRolls: number[] = []
    
    for (const die of explodedRolls) {
      if (die === 6) {
        newRolls.push(Math.floor(Math.random() * 6) + 1)
        changed = true
      } else {
        newRolls.push(die)
      }
    }
    
    explodedRolls = newRolls
  }
  
  // Re-sort and keep
  const sorted = [...explodedRolls].sort((a, b) => b - a)
  const kept = sorted.slice(0, result.keep)
  const total = kept.reduce((sum, die) => sum + die, 0)
  
  return {
    rolled: explodedRolls,
    kept,
    total,
    rolls: result.rolls,
    keep: result.keep,
  }
}

/**
 * Calculate raises (every 5 points over target)
 * @param total The total rolled
 * @param target Target number
 * @returns Number of raises achieved
 */
export function calculateRaises(total: number, target: number): number {
  const excess = total - target
  return excess < 0 ? 0 : Math.floor(excess / 5)
}
