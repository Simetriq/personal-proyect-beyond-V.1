import { Character } from '../domain/Character';
import { evaluateDeathState } from './health';

/**
 * Calculates the total action penalty applied due to chronic bleeding.
 * For every 5 accumulated HP lost to bleeding, applies a -10 penalty.
 * @param bleedingDamage Total HP lost strictly from bleeding over time
 * @returns The penalty to physical actions (a negative number or 0)
 */
export function getBleedingPenalty(bleedingDamage: number): number {
  const penaltyThresholds = Math.floor(bleedingDamage / 5);
  return -(penaltyThresholds * 10);
}

/**
 * Processes a single bleeding tick (usually 1 minute).
 * Drains 1 HP and accumulates the bleeding damage.
 * @param character The character suffering from bleeding
 */
export function tickBleeding(character: Character) {
  if (!character.isBleeding || character.isDead) {
    return;
  }

  character.currentHp -= 1;
  character.bleedingDamage += 1;

  // Check if they died from the bleeding tick
  evaluateDeathState(character);
}
