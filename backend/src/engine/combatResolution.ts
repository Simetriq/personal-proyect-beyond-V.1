import {
  FUMBLE_THRESHOLD,
  ARMOR_MULTIPLIER,
  CRITICAL_HP_RATIO,
  MIN_DAMAGE_PERCENT,
  MAX_COUNTER_BONUS,
  MANEUVER_PENALTIES,
  AIMED_ATTACK_PENALTIES,
  COVERAGE_PENALTIES,
  FATIGUE_BONUS_PER_LEVEL,
  CRITICAL_LOCATION_TABLE,
  DEFENDER_FUMBLE_PENALTY,
  CriticalLocation
} from '../constants/combat';
import { InvalidCombatInputError } from '../errors/CombatError';

export type RandomFn = () => number;

export interface CombatResolutionResult {
  damage: number;
  counterAttackBonus: number;
  message: string;
  isCritical?: boolean;
  criticalLevel?: number;
  criticalLocation?: CriticalLocation | '';
  isFumble?: boolean;
  fumbleLevel?: number;
  fumbleTarget?: 'attacker' | 'defender';
  weaponClash?: {
    attackerWeaponWon: boolean;
    broken: boolean;
  };
  armorAbsorbed?: number;
  spellsApplied?: string[];
  customNarrative?: string;
}

export interface CombatModifiers {
  isAreaAttack?: boolean;
  isDisarm?: boolean;
  isFullDefense?: boolean;
  aimedLocation?: string;
  coverage?: 'PARTIAL' | 'MILITARY' | 'TOTAL';
  burnedFatigueAttack?: number;
  burnedFatigueDefense?: number;
  attackerRawRoll?: number;
  defenderRawRoll?: number;
  envAttackMod?: number;
  envDefenseMod?: number;
  spellsApplied?: string[];
}

/**
 * Checks for a fumble in the combat roll.
 * @param rawRoll - The natural die roll (1-100).
 * @param target - Whether the roll belongs to the attacker or defender.
 * @param randomFn - Function to generate a random number.
 * @returns An object containing fumble status, level, and message.
 */
function checkFumble(rawRoll: number | undefined, target: 'attacker' | 'defender', randomFn: RandomFn) {
  if (rawRoll !== undefined && rawRoll <= FUMBLE_THRESHOLD) {
    return {
      isFumble: true,
      fumbleLevel: Math.floor(randomFn() * 50) + 10,
      target
    };
  }
  return { isFumble: false };
}

/**
 * Applies maneuver modifiers to the attack and defense rolls.
 * @param modifiers - The combat modifiers to apply.
 * @returns The adjustments for attack and defense, and whether a disarm attempt is made.
 */
function applyManeuverModifiers(modifiers: CombatModifiers): { attackAdjust: number; defenseAdjust: number; isDisarm: boolean } {
  let attackAdjust = 0;
  let defenseAdjust = 0;
  let isDisarm = false;

  if (modifiers.isAreaAttack) attackAdjust += MANEUVER_PENALTIES.AREA_ATTACK;
  if (modifiers.isDisarm) {
    attackAdjust += MANEUVER_PENALTIES.DISARM;
    isDisarm = true;
  }
  if (modifiers.isFullDefense) {
    defenseAdjust += MANEUVER_PENALTIES.FULL_DEFENSE;
  }
  if (modifiers.aimedLocation && modifiers.aimedLocation in AIMED_ATTACK_PENALTIES) {
    attackAdjust += AIMED_ATTACK_PENALTIES[modifiers.aimedLocation as keyof typeof AIMED_ATTACK_PENALTIES];
  }
  if (modifiers.coverage && modifiers.coverage in COVERAGE_PENALTIES) {
    attackAdjust += COVERAGE_PENALTIES[modifiers.coverage as keyof typeof COVERAGE_PENALTIES];
  }
  if (modifiers.burnedFatigueAttack) {
    attackAdjust += modifiers.burnedFatigueAttack * FATIGUE_BONUS_PER_LEVEL;
  }
  if (modifiers.burnedFatigueDefense) {
    defenseAdjust += modifiers.burnedFatigueDefense * FATIGUE_BONUS_PER_LEVEL;
  }

  return { attackAdjust, defenseAdjust, isDisarm };
}

/**
 * Rolls for a critical location.
 * @param randomFn - Function to generate a random number.
 * @returns The resulting critical location.
 */
function rollCriticalLocation(randomFn: RandomFn): CriticalLocation {
  const locRoll = Math.floor(randomFn() * 100) + 1;
  for (const [range, location] of Object.entries(CRITICAL_LOCATION_TABLE)) {
    const [minStr, maxStr] = range.split('-');
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    if (locRoll >= min && locRoll <= max) {
      return location;
    }
  }
  return 'PIERNA';
}

/**
 * Calculates net damage, percentage, and absorbed damage based on attack success.
 * @param diff - The difference between attack and defense.
 * @param baseDamage - The base damage of the weapon.
 * @param ta - The defender's armor type rating.
 * @returns The final calculated damage, percentage, and absorbed amount.
 */
function calculateNetDamage(diff: number, baseDamage: number, ta: number): { finalDamage: number; percentage: number; absorbed: number } {
  const absorbed = ta * ARMOR_MULTIPLIER;
  const netDiff = diff - absorbed;
  
  if (netDiff <= 0) {
    return { finalDamage: 0, percentage: 0, absorbed };
  }

  let percentage = Math.floor(netDiff / 10) * 10;
  if (percentage < MIN_DAMAGE_PERCENT) percentage = MIN_DAMAGE_PERCENT;

  const finalDamage = Math.floor((baseDamage * percentage) / 100);

  return { finalDamage, percentage, absorbed };
}

/**
 * Resolves a combat attack and calculates damage, criticals, and fumbles.
 * @param attackRoll - The final attack roll before modifiers.
 * @param defenseRoll - The final defense roll before modifiers.
 * @param baseDamage - The base damage of the attacker's weapon.
 * @param ta - The defender's armor type rating.
 * @param defenderHp - The defender's total hit points.
 * @param defenseType - Whether the defender blocked or dodged.
 * @param attackerWeaponROT - Attacker's weapon breakability (ROT).
 * @param defenderWeaponENT - Defender's weapon breakability (ENT).
 * @param modifiers - Additional combat modifiers.
 * @param randomFn - Random number generator.
 * @returns The final result of the combat interaction.
 * @throws {InvalidCombatInputError} If inputs are invalid.
 */
export function resolveAttack(
  attackRoll: number, 
  defenseRoll: number, 
  baseDamage: number, 
  ta: number,
  defenderHp: number,
  defenseType: 'BLOCK' | 'DODGE' = 'DODGE',
  attackerWeaponROT: number = 0,
  defenderWeaponENT: number = 0,
  modifiers?: CombatModifiers,
  randomFn: RandomFn = Math.random
): CombatResolutionResult {
  if (!Number.isFinite(attackRoll) || !Number.isFinite(defenseRoll) || baseDamage < 0) {
    throw new InvalidCombatInputError('Invalid combat inputs');
  }

  let finalAttackRoll = attackRoll;
  let finalDefenseRoll = defenseRoll;
  let customNarrative = '';

  if (modifiers?.envAttackMod) finalAttackRoll += modifiers.envAttackMod;
  if (modifiers?.envDefenseMod) finalDefenseRoll += modifiers.envDefenseMod;

  const attackerFumble = checkFumble(modifiers?.attackerRawRoll, 'attacker', randomFn);
  if (attackerFumble.isFumble) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `¡PIFIA del Atacante! (Dado natural: ${modifiers?.attackerRawRoll}). Tropieza y pierde la iniciativa.`,
      isFumble: true,
      fumbleLevel: attackerFumble.fumbleLevel,
      fumbleTarget: 'attacker'
    };
  }

  const defenderFumble = checkFumble(modifiers?.defenderRawRoll, 'defender', randomFn);
  if (defenderFumble.isFumble) {
    finalDefenseRoll += DEFENDER_FUMBLE_PENALTY;
  }

  let disarmAttempt = false;
  if (modifiers) {
    const { attackAdjust, defenseAdjust, isDisarm } = applyManeuverModifiers(modifiers);
    finalAttackRoll += attackAdjust;
    finalDefenseRoll += defenseAdjust;
    disarmAttempt = isDisarm;
  }

  const diff = finalAttackRoll - finalDefenseRoll;
  
  if (diff < 0) {
    let rawBonus = Math.floor(Math.abs(diff) / 2);
    let counterAttackBonus = Math.floor(rawBonus / 5) * 5;
    if (counterAttackBonus > MAX_COUNTER_BONUS) counterAttackBonus = MAX_COUNTER_BONUS;
    
    let weaponClash = undefined;
    let message = `Ataque bloqueado/esquivado. Oportunidad de Contraataque: +${counterAttackBonus}`;
    
    if (defenseType === 'BLOCK') {
      if (attackerWeaponROT > defenderWeaponENT) {
        weaponClash = { attackerWeaponWon: true, broken: true };
        message += ` ¡Choque de Armas! El arma del defensor ha sido ROTA (ROT ${attackerWeaponROT} vs ENT ${defenderWeaponENT}).`;
      } else {
        weaponClash = { attackerWeaponWon: false, broken: false };
      }
    }
    
    if (disarmAttempt && diff >= -50) {
      message += ` Intento de desarme fallido.`;
    }

    if (diff + (modifiers?.envDefenseMod || 0) >= 0) {
      customNarrative = `¡El impacto fue completamente desviado por las barreras mágicas de la sala!`;
      message += ' ' + customNarrative;
    }
    
    return {
      damage: 0,
      counterAttackBonus,
      message,
      weaponClash,
      armorAbsorbed: 0,
      customNarrative
    };
  }

  if (disarmAttempt) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `¡Desarme exitoso! (Dif: ${diff}). El defensor suelta su arma.`,
      armorAbsorbed: 0
    };
  }

  const { finalDamage, percentage, absorbed } = calculateNetDamage(diff, baseDamage, ta);
  
  if (percentage === 0) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `El ataque impactó (Dif: ${diff}), pero la armadura absorbió todo el daño.`,
      armorAbsorbed: absorbed
    };
  }

  let isCritical = false;
  let criticalLevel = 0;
  let criticalLocationStr: CriticalLocation | '' = '';
  
  if (finalDamage >= (defenderHp * CRITICAL_HP_RATIO) && finalDamage > 0) {
    isCritical = true;
    criticalLevel = Math.max(1, finalDamage - absorbed);
    criticalLocationStr = rollCriticalLocation(randomFn);
  }

  let message = `¡Impacto! (Dif: ${diff}, Net: ${diff - absorbed}). Se aplica ${percentage}% del Daño Base. Daño final: ${finalDamage}`;
  if (isCritical) {
    message += ` ¡IMPACTO CRÍTICO! (Nivel ${criticalLevel}, Loc: ${criticalLocationStr})`;
  }


  return {
    damage: finalDamage,
    counterAttackBonus: 0,
    message,
    isCritical,
    criticalLevel,
    criticalLocation: criticalLocationStr,
    armorAbsorbed: absorbed,
    spellsApplied: modifiers?.spellsApplied,
    customNarrative
  };
}
