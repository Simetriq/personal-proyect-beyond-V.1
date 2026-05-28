/**
 * Represents the level of mastery a character has over an equipped weapon.
 */
export enum WeaponMasteryLevel {
  MASTERED = 'MASTERED',
  SIMILAR = 'SIMILAR',
  MIXED = 'MIXED',
  UNFAMILIAR = 'UNFAMILIAR'
}

/**
 * Calculates the penalty for using a weapon without full mastery.
 * @param masteryLevel The mastery level the character has for the weapon
 * @returns The penalty to apply to HA and HD
 */
export function getWeaponMasteryPenalty(masteryLevel: WeaponMasteryLevel): number {
  switch (masteryLevel) {
    case WeaponMasteryLevel.MASTERED: return 0;
    case WeaponMasteryLevel.SIMILAR: return -20;
    case WeaponMasteryLevel.MIXED: return -40;
    case WeaponMasteryLevel.UNFAMILIAR: return -60;
  }
}
