/**
 * Core types for the Ki system in Anima: Beyond Fantasy.
 *
 * In Anima, Ki is NOT a single pool. Each character has 6 independent
 * Ki reserves, one per primary characteristic. Each reserve accumulates
 * independently and can be spent to fuel Dominion Techniques.
 */

/** The 6 characteristics that generate Ki reserves */
export type KiCharacteristic = 'FUE' | 'DES' | 'AGI' | 'CON' | 'POD' | 'VOL';

/** All valid Ki characteristic values as a runtime-accessible array */
export const KI_CHARACTERISTICS: readonly KiCharacteristic[] = [
  'FUE', 'DES', 'AGI', 'CON', 'POD', 'VOL',
] as const;

/**
 * A single Ki reserve for one characteristic.
 * - current: Ki currently accumulated (available to spend)
 * - maximum: Maximum Ki this reserve can hold (derived from characteristic value)
 * - accumulationBonus: Extra Ki gained per accumulation action (from advantages, items, etc.)
 */
export interface KiPool {
  current: number;
  maximum: number;
  accumulationBonus: number;
}

/**
 * The complete Ki reserve state for a character.
 * Each key maps to a KiPool for that characteristic.
 */
export interface KiReserves {
  FUE: KiPool;
  DES: KiPool;
  AGI: KiPool;
  CON: KiPool;
  POD: KiPool;
  VOL: KiPool;
}

/**
 * Represents the Ki cost of activating a Technique or ability.
 * Each field is optional — only the reserves actually consumed are specified.
 * Example: { FUE: 5, POD: 3 } means 5 Ki from Strength + 3 from Power.
 */
export interface KiCost {
  FUE?: number;
  DES?: number;
  AGI?: number;
  CON?: number;
  POD?: number;
  VOL?: number;
}

/**
 * Creates a default KiReserves object with all pools at 0/0.
 * Used when initializing a new character or when no Ki data exists.
 */
export function createDefaultKiReserves(): KiReserves {
  return {
    FUE: { current: 0, maximum: 0, accumulationBonus: 0 },
    DES: { current: 0, maximum: 0, accumulationBonus: 0 },
    AGI: { current: 0, maximum: 0, accumulationBonus: 0 },
    CON: { current: 0, maximum: 0, accumulationBonus: 0 },
    POD: { current: 0, maximum: 0, accumulationBonus: 0 },
    VOL: { current: 0, maximum: 0, accumulationBonus: 0 },
  };
}

/**
 * Calculates the total Ki currently available across all reserves.
 */
export function getTotalCurrentKi(reserves: KiReserves): number {
  let total = 0;
  for (const key of KI_CHARACTERISTICS) {
    total += reserves[key].current;
  }
  return total;
}

/**
 * Checks whether the given reserves can afford the specified cost.
 */
export function canAffordKiCost(reserves: KiReserves, cost: KiCost): boolean {
  for (const key of KI_CHARACTERISTICS) {
    const required = cost[key] ?? 0;
    if (required > 0 && reserves[key].current < required) {
      return false;
    }
  }
  return true;
}
