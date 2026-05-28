import { Character } from '../domain/Character';

/**
 * Validates if a physical attribute or derived index exceeds normal human limits.
 * In Anima, normal human limit is 10.
 * Above 10 requires Inhumanity. Above 13 requires Zen.
 * @param value The value to check (e.g. Movement Type, Weight Index, Strength)
 * @param character The character to check flags for
 * @returns The capped value if they don't have the required feats, or the full value if they do.
 */
export function enforceExistentialBarrier(value: number, character: Character): number {
  if (value > 13) {
    if (character.hasZen) {
      return value;
    } else if (character.hasInhumanity) {
      return 13;
    } else {
      return 10;
    }
  }
  
  if (value > 10) {
    if (character.hasInhumanity || character.hasZen) {
      return value;
    } else {
      return 10;
    }
  }

  return value;
}

/**
 * Gets the actual movement type of a character, applying existential barriers.
 * @param baseAgility Base agility stat
 * @param character The Character instance
 */
export function getMovementType(baseAgility: number, character: Character): number {
  // Simplified base mapping for Movement Type
  let movementType = baseAgility; 
  return enforceExistentialBarrier(movementType, character);
}
