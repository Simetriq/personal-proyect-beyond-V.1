import { Character } from '../domain/Character';

export interface WeaponSizeModifiers {
  baseDamageMultiplier: number;
  fortitudeBonus: number;
  breakageBonus: number;
  initiativePenalty: number;
}

/**
 * Calculates stat adjustments when a Medium-sized character wields an Enormous weapon.
 * @param characterSize The character's computed size (FUE + CON)
 * @param isWeaponEnormous True if the weapon is flagged as enormous
 * @returns Modifiers to apply to the weapon's stats and character's initiative
 */
export function getEnormousWeaponModifiers(characterSize: number, isWeaponEnormous: boolean): WeaponSizeModifiers {
  // Assuming 'Medium' size is between 8 and 22 roughly (Anima size ranges)
  // If the character is enormous themselves (size > 22), they might not suffer penalties, 
  // but for standard rules, a Medium char wielding Enormous gets:
  const isMediumSize = characterSize >= 8 && characterSize <= 22;

  if (isWeaponEnormous && isMediumSize) {
    return {
      baseDamageMultiplier: 1.5,
      fortitudeBonus: 6,
      breakageBonus: 3,
      initiativePenalty: -40
    };
  }

  // Default: no modifiers
  return {
    baseDamageMultiplier: 1.0,
    fortitudeBonus: 0,
    breakageBonus: 0,
    initiativePenalty: 0
  };
}
