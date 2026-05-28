export interface CombatResolutionResult {
  damage: number;
  counterAttackBonus: number;
  message: string;
  isCritical?: boolean;
  criticalLevel?: number;
  criticalLocation?: number;
  weaponClash?: {
    attackerWeaponWon: boolean;
    broken: boolean;
  };
}

export function resolveAttack(
  attackRoll: number, 
  defenseRoll: number, 
  baseDamage: number, 
  ta: number,
  defenderHp: number,
  defenseType: 'BLOCK' | 'DODGE' = 'DODGE',
  attackerWeaponROT: number = 0,
  defenderWeaponENT: number = 0
): CombatResolutionResult {
  const diff = attackRoll - defenseRoll;
  
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
    
    return {
      damage: 0,
      counterAttackBonus,
      message,
      weaponClash
    };
  }

  const absorb = ta * 10;
  const netDiff = diff - absorb;
  
  if (netDiff <= 0) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `El ataque impactó (Dif: ${diff}), pero la armadura absorbió todo el daño.`,
    };
  }

  let percentage = Math.floor(netDiff / 10) * 10;
  if (percentage < 10) percentage = 10;

  const finalDamage = Math.floor((baseDamage * percentage) / 100);

  // Fase 6.1: Crítico Automático
  let isCritical = false;
  let criticalLevel = 0;
  let criticalLocation = 0;
  
  if (finalDamage >= (defenderHp / 2) && finalDamage > 0) {
    isCritical = true;
    criticalLevel = finalDamage;
    criticalLocation = Math.floor(Math.random() * 100) + 1;
  }

  let message = `¡Impacto! (Dif: ${diff}, Net: ${netDiff}). Se aplica ${percentage}% del Daño Base. Daño final: ${finalDamage}`;
  if (isCritical) {
    message += ` ¡IMPACTO CRÍTICO! (Nivel ${criticalLevel}, Loc: ${criticalLocation})`;
  }

  return {
    damage: finalDamage,
    counterAttackBonus: 0,
    message,
    isCritical,
    criticalLevel,
    criticalLocation
  };
}
