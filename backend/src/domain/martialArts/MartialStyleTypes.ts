/**
 * Types for the Martial Arts system in Anima: Beyond Fantasy.
 *
 * Martial Styles are static game data (Kung Fu, Aikido, etc.) that grant
 * passive bonuses. Characters learn styles and can have one active at a time.
 * Switching styles in combat may incur penalties.
 */

/**
 * The passive bonuses granted by a Martial Style.
 */
export interface StyleBonuses {
  attackBonus: number;
  defenseBonus: number;
  damageBonus: number;
  initiativeBonus: number;
  dodgeBonus: number;
  freeManeuvers: string[];
}

/**
 * The full definition of a Martial Style (static game data).
 * These are NOT stored per-character — they live in a registry.
 */
export interface MartialStyleDef {
  id: string;
  name: string;
  description: string;
  bonuses: StyleBonuses;
  requiredLevel: number;
  switchPenalty: number;   // Initiative penalty when switching mid-combat
}

/**
 * Represents a style the character currently has active, with its resolved bonuses.
 */
export interface ActiveStyle {
  styleId: string;
  name: string;
  bonuses: StyleBonuses;
}

/**
 * A record that a character knows a specific style.
 */
export interface KnownStyle {
  styleId: string;
  isActive: boolean;
}

/**
 * Creates a "no style" / empty bonuses object.
 */
export function createEmptyBonuses(): StyleBonuses {
  return {
    attackBonus: 0,
    defenseBonus: 0,
    damageBonus: 0,
    initiativeBonus: 0,
    dodgeBonus: 0,
    freeManeuvers: [],
  };
}
