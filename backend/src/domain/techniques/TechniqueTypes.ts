/**
 * Types for the Dominion Technique system in Anima: Beyond Fantasy.
 *
 * Dominion Techniques are custom powers built by players, combining
 * multiple effects. They consume Ki from specific characteristic reserves
 * and may have ongoing maintenance costs.
 */

import type { KiCost } from '../ki/KiTypes';

/** The types of effects a Technique can produce */
export type TechniqueEffectType =
  | 'DAMAGE'    // Direct damage to target
  | 'AREA'      // Area-of-effect modifier
  | 'STATE'     // Inflicts an altered state
  | 'BUFF'      // Positive modifier to self/ally
  | 'DEBUFF'    // Negative modifier to enemy
  | 'HEAL'      // Restores HP or fatigue
  | 'MOVEMENT'  // Enhanced movement (speed, teleport, flight)
  | 'SPECIAL';  // Unique effects not covered above

/** Who the effect targets */
export type TechniqueTarget = 'SELF' | 'ENEMY' | 'ALLY' | 'AREA';

/**
 * A single effect within a Technique.
 * Techniques are built by combining multiple effects.
 */
export interface TechniqueEffect {
  type: TechniqueEffectType;
  value: number;
  description: string;
  target?: TechniqueTarget;
  damageType?: string;       // FIL, CON, PEN, CAL, ELE, FRI, ENE
  stateInflicted?: string;   // PARALISIS, CEGUERA, ATURDIDO, etc.
  durationRounds?: number;   // How long the effect lasts (0 = instant)
}

/**
 * The full data shape for a Technique, used for creation and hydration.
 */
export interface TechniqueData {
  id?: string;
  characterId: string;
  name: string;
  description: string;
  level: number;                    // 1-5 typically
  kiCost: KiCost;                   // Which reserves and how much
  maintenanceCost: KiCost;          // Per-turn cost if persistent
  effects: TechniqueEffect[];       // Combined effects
  isPersistent: boolean;            // Requires ongoing maintenance?
  isActive: boolean;                // Currently maintained?
}

/**
 * Creates a default empty KiCost (all zeros / undefined).
 */
export function createEmptyKiCost(): KiCost {
  return {};
}
