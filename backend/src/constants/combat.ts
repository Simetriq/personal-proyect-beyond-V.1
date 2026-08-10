/**
 * Constants for Anima VTT combat resolution.
 */

export const FUMBLE_THRESHOLD = 3 as const;
export const ARMOR_MULTIPLIER = 10 as const;
export const CRITICAL_HP_RATIO = 0.5 as const;
export const MIN_DAMAGE_PERCENT = 10 as const;
export const MAX_COUNTER_BONUS = 150 as const;
export const FATIGUE_BONUS_PER_LEVEL = 15 as const;
export const COUNTER_TIMEOUT_MS = 15000 as const;
export const RESISTIR_DOLOR_THRESHOLD = 50 as const;
export const ACROBACIAS_THRESHOLD = 50 as const;
export const INITIATIVE_DIFF_FOR_ACROBATICS = 50 as const;
export const ACROBATICS_BONUS = 10 as const;
export const DEFAULT_MAGIC_ACCUMULATION = 20 as const;
export const AGONY_RF_THRESHOLD = 120 as const;
export const CRITICAL_PENALTY_DURATION_ROUNDS = 5 as const;
export const DEFENDER_FUMBLE_PENALTY = -50 as const;

export const MANEUVER_PENALTIES = {
  AREA_ATTACK: -50,
  DISARM: -40,
  FULL_DEFENSE: 30,
  CHANNELING_DEFENSE: -20,
} as const;

export const AIMED_ATTACK_PENALTIES = {
  CABEZA: -60,
  OJOS: -100,
  TORSO: -20,
  BRAZO: -30,
  PIERNA: -30,
} as const;

export const COVERAGE_PENALTIES = {
  PARTIAL: -40,
  MILITARY: -20,
  TOTAL: 0,
} as const;

export type CriticalLocation = 'CABEZA' | 'TORSO' | 'BRAZO' | 'PIERNA';

export const CRITICAL_LOCATION_TABLE: Readonly<Record<string, CriticalLocation>> = {
  '1-10': 'CABEZA',
  '11-50': 'TORSO',
  '51-70': 'BRAZO',
  '71-100': 'PIERNA',
} as const;

