/**
 * Resuelve un ataque basado en las reglas de Anima: Beyond Fantasy.
 * @param attackRoll Tirada de ataque total (habilidad + dado + modificadores)
 * @param defenseRoll Tirada de defensa total (habilidad + dado + modificadores)
 * @param armorValue Valor de armadura (TA) aplicable al tipo de ataque
 * @param baseDamage Daño base del arma o ataque
 * @returns El daño final aplicado, o 0 si no hay daño.
 */
export function resolveAttack(
  attackRoll: number,
  defenseRoll: number,
  armorValue: number,
  baseDamage: number
): number {
  const margin = attackRoll - defenseRoll;
  
  // Fórmula de Anima: ((Margen - (20 + (TA * 10))) / 100) * Daño Base
  const damagePercentage = margin - (20 + (armorValue * 10));

  if (damagePercentage <= 0) {
    return 0; // No hay daño
  }

  // El daño se calcula multiplicando el porcentaje (sobre 100) por el daño base.
  // En el sistema de Anima suele redondearse hacia abajo, aunque a veces las decenas redondearían diferente.
  // Asumiremos truncar/Math.floor el resultado.
  const finalDamage = Math.floor((damagePercentage / 100) * baseDamage);
  
  return finalDamage > 0 ? finalDamage : 0;
}
