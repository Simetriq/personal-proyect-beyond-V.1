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
  
  // Si la defensa supera al ataque o es igual, hay contraataque
  if (diff <= 0) {
    const counterAttackBonus = Math.floor(Math.abs(diff) / 2);
    return {
      damage: 0,
      counterAttackBonus,
      message: `Ataque bloqueado/esquivado. Contraataque: +${counterAttackBonus}`,
    };
  }

  // El ataque impactó
  // Daño = (Diferencia - (TA * 10)) * baseDamage / 100
  const absorb = ta * 10;
  const netDiff = diff - absorb;
  
  if (netDiff <= 0) {
    return {
      damage: 0,
      counterAttackBonus: 0,
      message: `El ataque impactó (Dif: ${diff}), pero la armadura absorbió todo el daño.`,
    };
  }

  let finalDamage = Math.floor((netDiff * baseDamage) / 100);
  
  // Daño mínimo 1 si superó la armadura
  if (finalDamage < 1) finalDamage = 1;

  return {
    damage: finalDamage,
    counterAttackBonus: 0,
    message: `¡Impacto! (Dif: ${diff}). Daño final: ${finalDamage}`,
  };
}
