/**
 * Calcula la iniciativa total para un turno
 * @param baseInitiative Iniciativa base del personaje
 * @param roll Tirada de dado (puede incluir abiertos/pifias, asumimos el total resuelto aquí)
 * @param modifiers Modificadores adicionales temporales (buffs/debuffs)
 * @returns Iniciativa total
 */
export function calculateInitiative(
  baseInitiative: number,
  roll: number,
  modifiers: number = 0
): number {
  return baseInitiative + roll + modifiers;
}
