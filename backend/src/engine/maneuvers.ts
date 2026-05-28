export function applyAreaAttackModifier(baseHA: number): { ha: number; isMultiTarget: boolean } {
  return {
    ha: baseHA - 50,
    isMultiTarget: true
  };
}

export function applyDisarmModifier(baseHA: number): { ha: number; disarmOnSuccess: boolean } {
  return {
    ha: baseHA - 40,
    disarmOnSuccess: true
  };
}

export function applyFullDefense(baseHD: number, isSpecialCondition: boolean = false): number {
  return baseHD + (isSpecialCondition ? 60 : 30);
}

export type AimLocation = 'CABEZA' | 'OJOS' | 'CORAZON' | 'ABDOMEN' | 'BRAZO' | 'MUSLO' | 'PANTORRILLA';

const AIMED_ATTACK_PENALTIES: Record<AimLocation, number> = {
  'CABEZA': -60,
  'OJOS': -100,
  'CORAZON': -60,
  'ABDOMEN': -20,
  'BRAZO': -20,
  'MUSLO': -20,
  'PANTORRILLA': -10
};

export function applyAimedAttack(baseHA: number, location: AimLocation): { ha: number; location: AimLocation } {
  const penalty = AIMED_ATTACK_PENALTIES[location] || 0;
  return {
    ha: baseHA + penalty, // penalty is negative
    location
  };
}

export function resolvePresa(
  attackerStr: number, 
  defenderStr: number, 
  weaponHasPresa: boolean = false, 
  weaponPresaStr: number = 0
): { success: boolean; winner: 'ATTACKER' | 'DEFENDER' } {
  const effectiveAttackerStr = weaponHasPresa ? weaponPresaStr : attackerStr;
  
  // Opposed check: in Anima, typically characteristics checks are 1d10 + characteristic
  // We'll simplify the opposed check or assume the caller handles the roll, 
  // but the prompt says "requiere un control enfrentado basado en características... el backend debe resolver el control".
  // Let's resolve it using basic dice roll:
  const attackerRoll = Math.floor(Math.random() * 10) + 1 + effectiveAttackerStr;
  const defenderRoll = Math.floor(Math.random() * 10) + 1 + defenderStr;

  if (attackerRoll >= defenderRoll) {
    return { success: true, winner: 'ATTACKER' };
  } else {
    return { success: false, winner: 'DEFENDER' };
  }
}

export type CoverType = 'PARTIAL' | 'MILITARY' | 'TOTAL';

const COVERAGE_PENALTIES: Record<CoverType, number> = {
  'PARTIAL': -40,
  'MILITARY': -80,
  'TOTAL': -120 // Impossible unless destroying cover, but for simplicity
};

export function applyCoverageModifier(baseHA: number, coverType: CoverType): number {
  const penalty = COVERAGE_PENALTIES[coverType] || 0;
  return baseHA + penalty;
}

export function resolveReload(currentReloadLeft: number): { canFire: boolean; newReload: number } {
  if (currentReloadLeft > 0) {
    return { canFire: false, newReload: currentReloadLeft }; // Can't fire, handled on turn tick
  }
  return { canFire: true, newReload: 0 };
}
