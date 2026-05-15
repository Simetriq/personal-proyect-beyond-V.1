/**
 * Aplica daño directo basándose en la armadura (TA) del objetivo.
 * Regla Oficial de Anima: La Armadura (TA) reduce el daño de forma porcentual (10% por punto).
 * @param damageReceived El daño bruto ingresado
 * @param ta Valor de la Armadura (TA) para el tipo de daño correspondiente
 * @returns El daño final a restar de la vida (hp).
 */
export function applyDirectDamage(damageReceived: number, ta: number): number {
  if (damageReceived <= 0) return 0;

  // Calculamos el porcentaje de reducción (10% por cada punto de TA)
  // Aseguramos que la reducción no pase del 100% (TA 10+)
  const reductionPercentage = Math.min(ta * 0.10, 1.0);
  
  // Daño real es el daño recibido restando el porcentaje que absorbe la armadura
  let finalDamage = Math.floor(damageReceived * (1 - reductionPercentage));

  // Si la TA reduce el daño al 100% o casi, el golpe siempre hace al menos 1 punto (si el ataque impactó).
  if (finalDamage < 1 && damageReceived > 0) {
    finalDamage = 1;
  }

  return finalDamage;
}
