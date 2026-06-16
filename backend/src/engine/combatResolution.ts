export interface CombatResolutionResult {
  damage: number;
  counterAttackBonus: number;
  message: string;
  isCritical?: boolean;
  criticalLevel?: number;
  criticalLocation?: string;
  isFumble?: boolean;
  fumbleLevel?: number;
  fumbleTarget?: 'attacker' | 'defender';
  weaponClash?: {
    attackerWeaponWon: boolean;
    broken: boolean;
  };
  armorAbsorbed?: number;
}

export interface CombatModifiers {
  isAreaAttack?: boolean;
  isDisarm?: boolean;
  isFullDefense?: boolean;
  aimedLocation?: string;
  coverage?: 'PARTIAL' | 'MILITARY' | 'TOTAL';
  burnedFatigueAttack?: number;  // 1 = +15, 2 = +30
  burnedFatigueDefense?: number; // 1 = +15, 2 = +30
  attackerRawRoll?: number;
  defenderRawRoll?: number;
}

export function resolveAttack(
  attackRoll: number, 
  defenseRoll: number, 
  baseDamage: number, 
  ta: number,
  defenderHp: number,
  defenseType: 'BLOCK' | 'DODGE' = 'DODGE',
  attackerWeaponROT: number = 0,
  defenderWeaponENT: number = 0,
  modifiers?: CombatModifiers
): CombatResolutionResult {
  // Aplicar modificadores del backend (Fase 7)
  let finalAttackRoll = attackRoll;
  let finalDefenseRoll = defenseRoll;
  let disarmAttempt = false;

  // Fase 16: Pifias
  if (modifiers?.attackerRawRoll && modifiers.attackerRawRoll <= 3) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `¡PIFIA del Atacante! (Dado natural: ${modifiers.attackerRawRoll}). Tropieza y pierde la iniciativa.`,
      isFumble: true,
      fumbleLevel: Math.floor(Math.random() * 50) + 10,
      fumbleTarget: 'attacker'
    };
  }

  if (modifiers?.defenderRawRoll && modifiers.defenderRawRoll <= 3) {
    // Si el defensor pifia, sufre penalización en la defensa
    finalDefenseRoll -= 50; 
  }

  if (modifiers) {
    if (modifiers.isAreaAttack) finalAttackRoll -= 50;
    if (modifiers.isDisarm) {
      finalAttackRoll -= 40;
      disarmAttempt = true;
    }
    if (modifiers.isFullDefense) {
      finalDefenseRoll += 30; // +30 o +60, asumiendo base +30 aquí para simplificar
    }
    if (modifiers.aimedLocation) {
      const AIMED_ATTACK_PENALTIES: Record<string, number> = {
        'CABEZA': -60, 'OJOS': -100, 'CORAZON': -60, 'ABDOMEN': -20, 'BRAZO': -20, 'MUSLO': -20, 'PANTORRILLA': -10
      };
      finalAttackRoll += (AIMED_ATTACK_PENALTIES[modifiers.aimedLocation] || 0);
    }
    if (modifiers.coverage) {
      const COVERAGE_PENALTIES: Record<string, number> = { 'PARTIAL': -40, 'MILITARY': -80, 'TOTAL': -120 };
      finalAttackRoll += (COVERAGE_PENALTIES[modifiers.coverage] || 0);
    }
    if (modifiers.burnedFatigueAttack) {
      finalAttackRoll += (modifiers.burnedFatigueAttack * 15);
    }
    if (modifiers.burnedFatigueDefense) {
      finalDefenseRoll += (modifiers.burnedFatigueDefense * 15);
    }
  }

  const diff = finalAttackRoll - finalDefenseRoll;
  
  if (diff < 0) {
    let rawBonus = Math.floor(Math.abs(diff) / 2);
    let counterAttackBonus = Math.floor(rawBonus / 5) * 5;
    if (counterAttackBonus > 150) counterAttackBonus = 150;
    
    let weaponClash = undefined;
    let message = `Ataque bloqueado/esquivado. Oportunidad de Contraataque: +${counterAttackBonus}`;
    
    // Fase 6.3: Choque de Armas
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
    
    return {
      damage: 0,
      counterAttackBonus,
      message,
      weaponClash,
      armorAbsorbed: 0
    };
  }

  // Si fue un desarme exitoso (diff > 0), el daño es 0 y se desarma
  if (disarmAttempt) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `¡Desarme exitoso! (Dif: ${diff}). El defensor suelta su arma.`,
      armorAbsorbed: 0
    };
  }

  const absorb = ta * 10;
  const netDiff = diff - absorb;
  
  if (netDiff <= 0) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `El ataque impactó (Dif: ${diff}), pero la armadura absorbió todo el daño.`,
      armorAbsorbed: absorb
    };
  }

  let percentage = Math.floor(netDiff / 10) * 10;
  if (percentage < 10) percentage = 10;

  const finalDamage = Math.floor((baseDamage * percentage) / 100);

  // Fase 6.1 y 16: Crítico Automático
  let isCritical = false;
  let criticalLevel = 0;
  let criticalLocationStr = '';
  
  if (finalDamage >= (defenderHp / 2) && finalDamage > 0) {
    isCritical = true;
    criticalLevel = Math.max(1, finalDamage - (ta * 10)); // Nivel = Daño - (Armadura * 10)
    
    // Tabla D100 de Localización
    const locRoll = Math.floor(Math.random() * 100) + 1;
    if (locRoll <= 10) criticalLocationStr = 'Cabeza';
    else if (locRoll <= 50) criticalLocationStr = 'Torso';
    else if (locRoll <= 70) criticalLocationStr = 'Brazo';
    else criticalLocationStr = 'Pierna';
  }

  let message = `¡Impacto! (Dif: ${diff}, Net: ${netDiff}). Se aplica ${percentage}% del Daño Base. Daño final: ${finalDamage}`;
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
    armorAbsorbed: absorb
  };
}
