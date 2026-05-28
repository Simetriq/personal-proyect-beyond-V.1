export interface CombatResolutionResult {
  damage: number;
  counterAttackBonus: number;
  message: string;
}

export function resolveAttack(
  attackRoll: number, 
  defenseRoll: number, 
  baseDamage: number, 
  ta: number
): CombatResolutionResult {
  const diff = attackRoll - defenseRoll;
  
  // Si la defensa supera al ataque o es igual, hay contraataque (Fase 4)
  if (diff < 0) {
    let rawBonus = Math.floor(Math.abs(diff) / 2);
    // Redondeo a la baja en pasos de 5
    let counterAttackBonus = Math.floor(rawBonus / 5) * 5;
    if (counterAttackBonus > 150) counterAttackBonus = 150;
    
    return {
      damage: 0,
      counterAttackBonus,
      message: `Ataque bloqueado/esquivado. Oportunidad de Contraataque: +${counterAttackBonus}`,
    };
  }

  // El ataque impactó (Fase 3)
  const absorb = ta * 10;
  const netDiff = diff - absorb;
  
  // Si la TA absorbe todo
  if (netDiff <= 0) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `El ataque impactó (Dif: ${diff}), pero la armadura absorbió todo el daño.`,
    };
  }

  // El remanente se divide entre 10 y se redondea a la baja para %
  let percentage = Math.floor(netDiff / 10) * 10;
  
  // El daño mínimo aplicable si impacta es el 10%
  if (percentage < 10) {
    percentage = 10;
  }

  const finalDamage = Math.floor((baseDamage * percentage) / 100);

  return {
    damage: finalDamage,
    counterAttackBonus: 0,
    message: `¡Impacto! (Dif: ${diff}, Net: ${netDiff}). Se aplica ${percentage}% del Daño Base. Daño final: ${finalDamage}`,
  };
}
