import { Character } from '../domain/Character';

/**
 * Checks if a character has reached true death.
 * True death occurs when HP drops below 5 times their Constitution in negative.
 * @param currentHp The character's current HP
 * @param constitution The character's Constitution stat
 * @returns true if the character is dead, false otherwise
 */
export function isTrueDeath(currentHp: number, constitution: number): boolean {
  const deathThreshold = constitution * -5;
  return currentHp <= deathThreshold;
}

/**
 * Determines if a character is in Agony (Between life and death).
 * This occurs when HP is below 0, but above the true death threshold.
 * @param currentHp The character's current HP
 * @param constitution The character's Constitution stat
 * @returns true if in agony
 */
export function isAgony(currentHp: number, constitution: number): boolean {
  return currentHp < 0 && !isTrueDeath(currentHp, constitution);
}

/**
 * Evaluates the character's death status and updates their state.
 * @param character The character to evaluate
 */
export function evaluateDeathState(character: Character) {
  if (isTrueDeath(character.currentHp, character.constitution)) {
    character.isDead = true;
    character.state = 'MUERTO';
  } else if (isAgony(character.currentHp, character.constitution)) {
    character.state = 'INCONSCIENTE'; // Or a new state 'AGONIA'
  }
}
