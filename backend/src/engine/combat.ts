// Calcula el daño directo considerando la reducción porcentual por armadura
export function applyDirectDamage(damageReceived: number, ta: number): number {
  if (damageReceived <= 0) return 0;

  const reductionPercentage = Math.min(ta * 0.10, 1.0);
  let finalDamage = Math.floor(damageReceived * (1 - reductionPercentage));

  if (finalDamage < 1 && damageReceived > 0) {
    finalDamage = 1;
  }

  return finalDamage;
}
