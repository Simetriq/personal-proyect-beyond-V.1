import { Character } from '../domain/Character';

export interface FatiguePenalties {
  actionModifier: number;
  movementModifier: number;
}

/**
 * Calculates global action penalties based on the character's current fatigue.
 * Fatigue 4: -10, 3: -20, 2: -40, 1: -80, 0: -120.
 * @param currentFatigue The character's current fatigue points
 * @returns The action penalty
 */
export function getFatigueActionPenalty(currentFatigue: number): number {
  if (currentFatigue >= 5) return 0;
  
  switch (currentFatigue) {
    case 4: return -10;
    case 3: return -20;
    case 2: return -40;
    case 1: return -80;
    case 0: return -120;
    default: return -120; // If below 0 somehow
  }
}

/**
 * Calculates overload penalties based on inventory weight.
 * @param currentWeight Total weight of equipped/carried inventory
 * @param character The character
 * @returns Overload penalties and fatigue drain rates
 */
export function calculateOverload(currentWeight: number, character: Character): { movementModifier: number, fatigueDrainRate: 'NONE' | '30_MIN' | 'PER_ROUND' } {
  const naturalLimit = character.strength * 5; // Placeholder math: natural carrying limit
  const maxLimit = character.getMaxLoad();

  if (currentWeight > maxLimit) {
    return { movementModifier: -5, fatigueDrainRate: 'PER_ROUND' };
  } else if (currentWeight > naturalLimit) {
    return { movementModifier: -2, fatigueDrainRate: '30_MIN' };
  }

  return { movementModifier: 0, fatigueDrainRate: 'NONE' };
}

/**
 * Calculates the total action and movement penalties combined.
 * @param character The character to evaluate
 * @param currentWeight Current total inventory weight
 */
export function getTotalFatiguePenalties(character: Character, currentWeight: number = 0): FatiguePenalties {
  const actionPenalty = getFatigueActionPenalty(character.currentFatigue);
  const overload = calculateOverload(currentWeight, character);

  return {
    actionModifier: actionPenalty,
    movementModifier: overload.movementModifier
  };
}
